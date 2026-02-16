package usecase

import (
	"context"
	"encoding/json"
	"sort"
	"strings"
	"time"
)

const projectPlannerTaskMetaPrefix = "__planner_meta__:"

type projectPlannerTaskMeta struct {
	Kind       string `json:"kind"`
	ParentType string `json:"parentType"`
	ParentID   string `json:"parentId"`
}

type ProjectExportSummary struct {
	ProjectPercent      int `json:"projectPercent"`
	TotalPhases         int `json:"totalPhases"`
	TotalTasks          int `json:"totalTasks"`
	TotalTrackedTasks   int `json:"totalTrackedTasks"`
	TotalCompletedTasks int `json:"totalCompletedTasks"`
}

type ProjectExportPlanningItem struct {
	ID              string               `json:"id"`
	ParentID        string               `json:"parentId,omitempty"`
	Level           int                  `json:"level"`
	Kind            string               `json:"kind"`
	PhaseID         string               `json:"phaseId,omitempty"`
	Title           string               `json:"title"`
	Description     string               `json:"description"`
	StartsOn        *time.Time           `json:"startsOn,omitempty"`
	EndsOn          *time.Time           `json:"endsOn,omitempty"`
	Status          string               `json:"status"`
	ProgressPercent int                  `json:"progressPercent"`
	Position        int                  `json:"position"`
	Files           []ProjectRelatedFile `json:"files"`
}

type ProjectExport struct {
	Project     ProjectDetail               `json:"project"`
	Summary     ProjectExportSummary        `json:"summary"`
	Planning    []ProjectExportPlanningItem `json:"planning"`
	GeneratedAt time.Time                   `json:"generatedAt"`
}

func (s *ProjectService) ExportProject(
	ctx context.Context,
	projectID string,
) (ProjectExport, error) {
	project, err := s.GetProjectDetail(ctx, projectID)
	if err != nil {
		return ProjectExport{}, err
	}

	return buildProjectExport(project), nil
}

type projectExportProgressCount struct {
	totalTasks     int
	completedTasks int
}

func buildProjectExport(project ProjectDetail) ProjectExport {
	taskByID := make(map[string]ProjectTask, len(project.Tasks))
	for _, task := range project.Tasks {
		taskByID[task.ID] = task
	}

	knownPhaseID := make(map[string]struct{}, len(project.Phases))
	topLevelTaskIDsByPhaseID := make(map[string][]string, len(project.Phases))
	for _, phase := range project.Phases {
		knownPhaseID[phase.ID] = struct{}{}
		topLevelTaskIDsByPhaseID[phase.ID] = []string{}
	}

	childrenByTaskID := make(map[string][]string, len(project.Tasks))
	unlinkedTopLevelTaskIDs := make([]string, 0)

	for _, task := range project.Tasks {
		meta, hasMeta := parseProjectPlannerTaskMeta(task.Objective)
		parentID := strings.TrimSpace(meta.ParentID)
		hasParentTask := hasMeta &&
			meta.Kind == "task" &&
			meta.ParentType != "phase" &&
			parentID != ""
		if hasParentTask {
			if _, ok := taskByID[parentID]; ok {
				childrenByTaskID[parentID] = append(childrenByTaskID[parentID], task.ID)
				continue
			}
		}

		if _, ok := knownPhaseID[task.ProjectPhaseID]; ok {
			topLevelTaskIDsByPhaseID[task.ProjectPhaseID] = append(
				topLevelTaskIDsByPhaseID[task.ProjectPhaseID],
				task.ID,
			)
			continue
		}

		unlinkedTopLevelTaskIDs = append(unlinkedTopLevelTaskIDs, task.ID)
	}

	taskPercentByID := make(map[string]int, len(project.Tasks))
	taskCountByID := make(map[string]projectExportProgressCount, len(project.Tasks))
	visitedTaskID := make(map[string]bool, len(project.Tasks))

	var computeTaskCount func(taskID string) projectExportProgressCount
	computeTaskCount = func(taskID string) projectExportProgressCount {
		if count, ok := taskCountByID[taskID]; ok {
			return count
		}

		if visitedTaskID[taskID] {
			return projectExportProgressCount{}
		}
		visitedTaskID[taskID] = true

		count := projectExportProgressCount{}
		for _, childID := range childrenByTaskID[taskID] {
			childCount := computeTaskCount(childID)
			count.totalTasks += childCount.totalTasks
			count.completedTasks += childCount.completedTasks
		}

		if len(childrenByTaskID[taskID]) == 0 && count.totalTasks == 0 {
			task, ok := taskByID[taskID]
			if ok {
				if isProjectTaskCancelled(task.Status) {
					count.totalTasks = 0
					count.completedTasks = 0
				} else {
					count.totalTasks = 1
				}
				if isProjectTaskCompleted(task.Status) {
					count.completedTasks = 1
				}
			}
		}

		delete(visitedTaskID, taskID)
		taskCountByID[taskID] = count
		taskPercentByID[taskID] = projectPercentFromCounts(
			count.completedTasks,
			count.totalTasks,
		)

		return count
	}

	for _, task := range project.Tasks {
		computeTaskCount(task.ID)
	}

	phasePercentByID := make(map[string]int, len(project.Phases))
	projectCount := projectExportProgressCount{}

	for _, phase := range project.Phases {
		phaseCount := projectExportProgressCount{}
		for _, taskID := range topLevelTaskIDsByPhaseID[phase.ID] {
			taskCount := taskCountByID[taskID]
			phaseCount.totalTasks += taskCount.totalTasks
			phaseCount.completedTasks += taskCount.completedTasks
		}

		phasePercentByID[phase.ID] = projectPercentFromCounts(
			phaseCount.completedTasks,
			phaseCount.totalTasks,
		)
		projectCount.totalTasks += phaseCount.totalTasks
		projectCount.completedTasks += phaseCount.completedTasks
	}

	for _, taskID := range unlinkedTopLevelTaskIDs {
		taskCount := taskCountByID[taskID]
		projectCount.totalTasks += taskCount.totalTasks
		projectCount.completedTasks += taskCount.completedTasks
	}

	rows := make([]ProjectExportPlanningItem, 0, len(project.Phases)+len(project.Tasks)+1)

	orderedPhases := append([]ProjectPhase(nil), project.Phases...)
	sort.Slice(orderedPhases, func(i, j int) bool {
		return compareProjectPhaseForExport(orderedPhases[i], orderedPhases[j]) < 0
	})

	orderTaskIDs := func(taskIDs []string) {
		sort.Slice(taskIDs, func(i, j int) bool {
			leftTask, leftOK := taskByID[taskIDs[i]]
			rightTask, rightOK := taskByID[taskIDs[j]]
			if !leftOK || !rightOK {
				return taskIDs[i] < taskIDs[j]
			}
			return compareProjectTaskForExport(leftTask, rightTask) < 0
		})
	}

	var appendTaskRows func(taskID, parentID, phaseID string, level int)
	appendTaskRows = func(taskID, parentID, phaseID string, level int) {
		task, ok := taskByID[taskID]
		if !ok {
			return
		}

		meta, hasMeta := parseProjectPlannerTaskMeta(task.Objective)
		kind := "task"
		if hasMeta && meta.Kind == "subphase" {
			kind = "subphase"
		}

		status := normalizeProjectTaskStatusForExport(task.Status)
		progressPercent := taskPercentByID[task.ID]
		if kind != "task" {
			status = projectStatusFromPercent(progressPercent)
		}

		rows = append(rows, ProjectExportPlanningItem{
			ID:              task.ID,
			ParentID:        parentID,
			Level:           level,
			Kind:            kind,
			PhaseID:         phaseID,
			Title:           task.Name,
			Description:     task.Description,
			StartsOn:        task.StartsOn,
			EndsOn:          task.EndsOn,
			Status:          status,
			ProgressPercent: progressPercent,
			Position:        task.Position,
			Files:           task.Files,
		})

		childIDs := append([]string(nil), childrenByTaskID[task.ID]...)
		orderTaskIDs(childIDs)
		for _, childID := range childIDs {
			appendTaskRows(childID, task.ID, phaseID, level+1)
		}
	}

	for _, phase := range orderedPhases {
		phasePercent := phasePercentByID[phase.ID]
		rows = append(rows, ProjectExportPlanningItem{
			ID:              phase.ID,
			Level:           0,
			Kind:            "phase",
			PhaseID:         phase.ID,
			Title:           phase.Name,
			Description:     phase.Description,
			StartsOn:        phase.StartsOn,
			EndsOn:          phase.EndsOn,
			Status:          projectStatusFromPercent(phasePercent),
			ProgressPercent: phasePercent,
			Position:        phase.Position,
			Files:           phase.Files,
		})

		topLevelTaskIDs := append([]string(nil), topLevelTaskIDsByPhaseID[phase.ID]...)
		orderTaskIDs(topLevelTaskIDs)
		for _, taskID := range topLevelTaskIDs {
			appendTaskRows(taskID, phase.ID, phase.ID, 1)
		}
	}

	if len(unlinkedTopLevelTaskIDs) > 0 {
		orderTaskIDs(unlinkedTopLevelTaskIDs)
		unlinkedCount := projectExportProgressCount{}
		for _, taskID := range unlinkedTopLevelTaskIDs {
			taskCount := taskCountByID[taskID]
			unlinkedCount.totalTasks += taskCount.totalTasks
			unlinkedCount.completedTasks += taskCount.completedTasks
		}
		unlinkedPercent := projectPercentFromCounts(
			unlinkedCount.completedTasks,
			unlinkedCount.totalTasks,
		)

		rows = append(rows, ProjectExportPlanningItem{
			ID:              "unlinked-phase",
			Level:           0,
			Kind:            "phase",
			Title:           "Sem fase",
			Description:     "Tarefas sem fase vinculada",
			Status:          projectStatusFromPercent(unlinkedPercent),
			ProgressPercent: unlinkedPercent,
			Position:        0,
			Files:           []ProjectRelatedFile{},
		})

		for _, taskID := range unlinkedTopLevelTaskIDs {
			appendTaskRows(taskID, "unlinked-phase", "", 1)
		}
	}

	return ProjectExport{
		Project: project,
		Summary: ProjectExportSummary{
			ProjectPercent:      projectPercentFromCounts(projectCount.completedTasks, projectCount.totalTasks),
			TotalPhases:         len(project.Phases),
			TotalTasks:          len(project.Tasks),
			TotalTrackedTasks:   projectCount.totalTasks,
			TotalCompletedTasks: projectCount.completedTasks,
		},
		Planning:    rows,
		GeneratedAt: time.Now().UTC(),
	}
}

func parseProjectPlannerTaskMeta(objective string) (projectPlannerTaskMeta, bool) {
	trimmedObjective := strings.TrimSpace(objective)
	if !strings.HasPrefix(trimmedObjective, projectPlannerTaskMetaPrefix) {
		return projectPlannerTaskMeta{}, false
	}

	rawMeta := strings.TrimSpace(strings.TrimPrefix(trimmedObjective, projectPlannerTaskMetaPrefix))
	if rawMeta == "" {
		return projectPlannerTaskMeta{}, false
	}

	var meta projectPlannerTaskMeta
	if err := json.Unmarshal([]byte(rawMeta), &meta); err != nil {
		return projectPlannerTaskMeta{}, false
	}

	meta.Kind = strings.ToLower(strings.TrimSpace(meta.Kind))
	meta.ParentType = strings.ToLower(strings.TrimSpace(meta.ParentType))
	meta.ParentID = strings.TrimSpace(meta.ParentID)

	switch meta.Kind {
	case "subphase":
		return meta, true
	case "task":
		switch meta.ParentType {
		case "phase", "subphase", "task":
			return meta, true
		}
	}

	return projectPlannerTaskMeta{}, false
}

func isProjectTaskCompleted(status string) bool {
	return normalizeProjectTaskStatusForExport(status) == "concluida"
}

func isProjectTaskCancelled(status string) bool {
	return normalizeProjectTaskStatusForExport(status) == "cancelada"
}

func normalizeProjectTaskStatusForExport(status string) string {
	normalized := normalizeProjectTaskStatus(status)
	if _, ok := allowedProjectTaskStatuses[normalized]; !ok {
		return "planejada"
	}

	return normalized
}

func projectPercentFromCounts(completedTasks, totalTasks int) int {
	if totalTasks <= 0 {
		return 0
	}

	percent := int((float64(completedTasks)/float64(totalTasks))*100 + 0.5)
	if percent < 0 {
		return 0
	}
	if percent > 100 {
		return 100
	}

	return percent
}

func projectStatusFromPercent(percent int) string {
	if percent >= 100 {
		return "concluida"
	}
	if percent > 0 {
		return "iniciada"
	}

	return "planejada"
}

func compareProjectPhaseForExport(left, right ProjectPhase) int {
	if left.StartsOn != nil && right.StartsOn != nil {
		if !left.StartsOn.Equal(*right.StartsOn) {
			if left.StartsOn.Before(*right.StartsOn) {
				return -1
			}
			return 1
		}
	} else if left.StartsOn != nil {
		return -1
	} else if right.StartsOn != nil {
		return 1
	}

	if left.Position != right.Position {
		if left.Position < right.Position {
			return -1
		}
		return 1
	}

	leftName := strings.ToLower(strings.TrimSpace(left.Name))
	rightName := strings.ToLower(strings.TrimSpace(right.Name))
	if leftName != rightName {
		if leftName < rightName {
			return -1
		}
		return 1
	}

	if left.ID < right.ID {
		return -1
	}
	if left.ID > right.ID {
		return 1
	}

	return 0
}

func compareProjectTaskForExport(left, right ProjectTask) int {
	if left.StartsOn != nil && right.StartsOn != nil {
		if !left.StartsOn.Equal(*right.StartsOn) {
			if left.StartsOn.Before(*right.StartsOn) {
				return -1
			}
			return 1
		}
	} else if left.StartsOn != nil {
		return -1
	} else if right.StartsOn != nil {
		return 1
	}

	if left.Position != right.Position {
		if left.Position < right.Position {
			return -1
		}
		return 1
	}

	leftName := strings.ToLower(strings.TrimSpace(left.Name))
	rightName := strings.ToLower(strings.TrimSpace(right.Name))
	if leftName != rightName {
		if leftName < rightName {
			return -1
		}
		return 1
	}

	if left.ID < right.ID {
		return -1
	}
	if left.ID > right.ID {
		return 1
	}

	return 0
}
