package usecase

import (
	"bytes"
	"context"
	"fmt"
	"math"
	"strings"
	"time"
	"unicode/utf8"
)

const (
	projectPDFPageWidth  = 595.0
	projectPDFPageHeight = 842.0
	projectPDFMarginX    = 36.0
	projectPDFMarginTop  = 40.0
	projectPDFLineHeight = 13.0
	projectPDFFontSize   = 10.0
	projectPDFWrapWidth  = 108
)

type ProjectPDFStyle struct {
	Theme string
	Font  string
}

type resolvedProjectPDFStyle struct {
	Theme           string
	Font            string
	RegularBaseFont string
	BoldBaseFont    string
	DarkTheme       bool
	BackgroundColor [3]float64
	HeadingColor    [3]float64
	BodyColor       [3]float64
	MutedColor      [3]float64
}

func (s *ProjectService) ExportProjectPDF(
	ctx context.Context,
	projectID string,
	style ProjectPDFStyle,
) ([]byte, error) {
	exportPayload, err := s.ExportProject(ctx, projectID)
	if err != nil {
		return nil, err
	}

	resolvedStyle := resolveProjectPDFStyle(style)
	lines := buildProjectPDFLines(exportPayload, resolvedStyle)
	return renderSimpleProjectPDF(lines, resolvedStyle), nil
}

func resolveProjectPDFStyle(input ProjectPDFStyle) resolvedProjectPDFStyle {
	normalizedTheme := strings.ToLower(strings.TrimSpace(input.Theme))
	darkTheme := normalizedTheme == "dark"
	if !darkTheme {
		normalizedTheme = "light"
	}

	normalizedFont := normalizeProjectPDFFont(input.Font)
	regularFont, boldFont := resolveProjectPDFFontFamily(normalizedFont)

	style := resolvedProjectPDFStyle{
		Theme:           normalizedTheme,
		Font:            normalizedFont,
		RegularBaseFont: regularFont,
		BoldBaseFont:    boldFont,
		DarkTheme:       darkTheme,
		BackgroundColor: [3]float64{1.0, 1.0, 1.0},
		HeadingColor:    [3]float64{0.129, 0.306, 0.569},
		BodyColor:       [3]float64{0.122, 0.176, 0.255},
		MutedColor:      [3]float64{0.318, 0.396, 0.478},
	}

	if darkTheme {
		style.BackgroundColor = [3]float64{0.071, 0.094, 0.133}
		style.HeadingColor = [3]float64{0.608, 0.741, 0.949}
		style.BodyColor = [3]float64{0.925, 0.941, 0.965}
		style.MutedColor = [3]float64{0.745, 0.788, 0.839}
	}

	return style
}

func normalizeProjectPDFFont(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "quicksand", "metrophobic", "parkinsans", "antic", "ubuntu-sans", "anaheim", "arima", "bellota":
		return strings.ToLower(strings.TrimSpace(value))
	default:
		return "quicksand"
	}
}

func resolveProjectPDFFontFamily(font string) (string, string) {
	_ = font
	return "Helvetica", "Helvetica-Bold"
}

func buildProjectPDFLines(exportPayload ProjectExport, style resolvedProjectPDFStyle) []string {
	project := exportPayload.Project
	summary := exportPayload.Summary

	generatedAt := exportPayload.GeneratedAt
	if generatedAt.IsZero() {
		generatedAt = time.Now().UTC()
	}

	lines := []string{
		"RELATORIO DO PROJETO",
		fmt.Sprintf("Gerado em: %s", generatedAt.Local().Format("02/01/2006 15:04:05")),
		fmt.Sprintf("Estilo do sistema: tema %s | fonte %s", formatProjectPDFThemeLabel(style.Theme), formatProjectPDFFontLabel(style.Font)),
		"",
		fmt.Sprintf("Projeto: %s", fallbackProjectText(project.Name)),
		fmt.Sprintf("Objetivo: %s", fallbackProjectText(project.Objective)),
		fmt.Sprintf("Tipo: %s (%s)", fallbackProjectText(project.ProjectTypeName), fallbackProjectText(project.ProjectCategoryName)),
		fmt.Sprintf("Ciclo: %s", formatProjectLifecycleLabel(project.LifecycleType)),
		fmt.Sprintf("Status: %s", formatProjectActiveLabel(project.Active)),
		fmt.Sprintf("Periodo: %s ate %s", formatProjectDate(project.StartDate), formatProjectDate(project.EndDate)),
		fmt.Sprintf("Manutencao mensal: %s", formatProjectYesNo(project.HasMonthlyMaintenance)),
		"",
		"RESUMO",
		fmt.Sprintf("Percentual concluido: %d%%", summary.ProjectPercent),
		fmt.Sprintf("Fases: %d | Tarefas: %d | Tarefas rastreadas: %d | Concluidas: %d", summary.TotalPhases, summary.TotalTasks, summary.TotalTrackedTasks, summary.TotalCompletedTasks),
		"",
		"CLIENTES",
	}

	if len(project.Clients) == 0 {
		lines = append(lines, "Nenhum cliente vinculado.")
	} else {
		for _, client := range project.Clients {
			lines = append(lines, fmt.Sprintf("- %s | %s | %s | papel: %s", fallbackProjectText(client.Name), fallbackProjectText(client.Email), fallbackProjectText(client.Login), fallbackProjectText(client.Role)))
		}
	}

	lines = append(lines, "", "RECEITAS")
	if len(project.Revenues) == 0 {
		lines = append(lines, "Nenhuma receita cadastrada.")
	} else {
		for _, revenue := range project.Revenues {
			lines = append(lines, fmt.Sprintf("- %s | valor: %.2f | status: %s | prevista: %s | recebida: %s", fallbackProjectText(revenue.Title), revenue.Amount, formatProjectRevenueStatus(revenue.Status), formatProjectDate(revenue.ExpectedOn), formatProjectDate(revenue.ReceivedOn)))
			if len(revenue.Receipts) == 0 {
				lines = append(lines, "  comprovantes: nenhum")
				continue
			}
			for _, receipt := range revenue.Receipts {
				lines = append(lines, fmt.Sprintf("  comprovante: %s | %s | %s", fallbackProjectText(receipt.FileName), fallbackProjectText(receipt.ContentType), formatProjectDate(receipt.IssuedOn)))
			}
		}
	}

	lines = append(lines, "", "COBRANCAS MENSAIS")
	if len(project.MonthlyCharges) == 0 {
		lines = append(lines, "Nenhuma cobranca mensal cadastrada.")
	} else {
		for _, charge := range project.MonthlyCharges {
			lines = append(lines, fmt.Sprintf("- %s | valor: %.2f | vencimento: dia %d | inicio: %s | fim: %s | status: %s", fallbackProjectText(charge.Title), charge.Amount, charge.DueDay, formatProjectDate(charge.StartsOn), formatProjectDate(charge.EndsOn), formatProjectActiveLabel(charge.Active)))
		}
	}

	lines = append(lines, "", "PLANEJAMENTO (FASES, SUB-FASES E TAREFAS)")
	if len(exportPayload.Planning) == 0 {
		lines = append(lines, "Nenhuma fase/tarefa cadastrada.")
	} else {
		for _, item := range exportPayload.Planning {
			indentLevel := maxProjectInt(item.Level, 0)
			prefix := strings.Repeat("    ", indentLevel)
			lines = append(lines, fmt.Sprintf("%s[%s] %s (%s) | status: %s | concluido: %d%% | inicio: %s | fim: %s",
				prefix,
				formatProjectPlanningIcon(item.Kind),
				fallbackProjectText(item.Title),
				formatProjectPlanningKind(item.Kind),
				formatProjectTaskStatus(item.Status),
				item.ProgressPercent,
				formatProjectDate(item.StartsOn),
				formatProjectDate(item.EndsOn),
			))

			if len(item.Files) == 0 {
				continue
			}
			for _, file := range item.Files {
				lines = append(lines, fmt.Sprintf("%s    - arquivo: %s | chave: %s", prefix, fallbackProjectText(file.FileName), fallbackProjectText(file.FileKey)))
			}
		}
	}

	return wrapProjectPDFLines(lines, projectPDFWrapWidth)
}

func renderSimpleProjectPDF(lines []string, style resolvedProjectPDFStyle) []byte {
	if len(lines) == 0 {
		lines = []string{"Relatorio vazio."}
	}

	maxLinesPerPage := int(math.Floor(
		(projectPDFPageHeight - projectPDFMarginTop - projectPDFMarginX) / projectPDFLineHeight,
	))
	if maxLinesPerPage < 1 {
		maxLinesPerPage = 1
	}

	pages := make([][]string, 0, (len(lines)/maxLinesPerPage)+1)
	for start := 0; start < len(lines); start += maxLinesPerPage {
		end := start + maxLinesPerPage
		if end > len(lines) {
			end = len(lines)
		}
		pages = append(pages, lines[start:end])
	}
	if len(pages) == 0 {
		pages = append(pages, []string{"Relatorio vazio."})
	}

	type pageObject struct {
		pageID    int
		contentID int
		content   []byte
	}

	const (
		fontRegularID = 1
		pagesID       = 2
		catalogID     = 3
		fontBoldID    = 4
	)

	nextObjectID := 5
	pageObjects := make([]pageObject, 0, len(pages))
	for _, pageLines := range pages {
		contentID := nextObjectID
		nextObjectID++
		pageID := nextObjectID
		nextObjectID++

		pageObjects = append(pageObjects, pageObject{
			pageID:    pageID,
			contentID: contentID,
			content: buildProjectPDFContentStream(
				pageLines,
				projectPDFMarginX,
				projectPDFPageHeight-projectPDFMarginTop,
				projectPDFLineHeight,
				projectPDFFontSize,
				style,
			),
		})
	}

	objectBodies := make(map[int][]byte, nextObjectID)
	objectBodies[fontRegularID] = []byte(fmt.Sprintf(
		"<< /Type /Font /Subtype /Type1 /BaseFont /%s /Encoding /WinAnsiEncoding >>",
		style.RegularBaseFont,
	))
	objectBodies[fontBoldID] = []byte(fmt.Sprintf(
		"<< /Type /Font /Subtype /Type1 /BaseFont /%s /Encoding /WinAnsiEncoding >>",
		style.BoldBaseFont,
	))

	kids := make([]string, 0, len(pageObjects))
	for _, page := range pageObjects {
		kids = append(kids, fmt.Sprintf("%d 0 R", page.pageID))
	}
	objectBodies[pagesID] = []byte(fmt.Sprintf(
		"<< /Type /Pages /Kids [%s] /Count %d >>",
		strings.Join(kids, " "),
		len(pageObjects),
	))
	objectBodies[catalogID] = []byte(fmt.Sprintf("<< /Type /Catalog /Pages %d 0 R >>", pagesID))

	for _, page := range pageObjects {
		objectBodies[page.contentID] = []byte(fmt.Sprintf(
			"<< /Length %d >>\nstream\n%s\nendstream",
			len(page.content),
			string(page.content),
		))
		objectBodies[page.pageID] = []byte(fmt.Sprintf(
			"<< /Type /Page /Parent %d 0 R /MediaBox [0 0 %.0f %.0f] /Resources << /Font << /F1 %d 0 R /F2 %d 0 R >> >> /Contents %d 0 R >>",
			pagesID,
			projectPDFPageWidth,
			projectPDFPageHeight,
			fontRegularID,
			fontBoldID,
			page.contentID,
		))
	}

	var buffer bytes.Buffer
	buffer.WriteString("%PDF-1.4\n")

	offsets := make([]int, nextObjectID)
	for objectID := 1; objectID < nextObjectID; objectID++ {
		offsets[objectID] = buffer.Len()
		body := objectBodies[objectID]
		buffer.WriteString(fmt.Sprintf("%d 0 obj\n", objectID))
		buffer.Write(body)
		if len(body) == 0 || body[len(body)-1] != '\n' {
			buffer.WriteByte('\n')
		}
		buffer.WriteString("endobj\n")
	}

	xrefOffset := buffer.Len()
	buffer.WriteString(fmt.Sprintf("xref\n0 %d\n", nextObjectID))
	buffer.WriteString("0000000000 65535 f \n")
	for objectID := 1; objectID < nextObjectID; objectID++ {
		buffer.WriteString(fmt.Sprintf("%010d 00000 n \n", offsets[objectID]))
	}

	buffer.WriteString(fmt.Sprintf(
		"trailer\n<< /Size %d /Root %d 0 R >>\nstartxref\n%d\n%%%%EOF\n",
		nextObjectID,
		catalogID,
		xrefOffset,
	))

	return buffer.Bytes()
}

func buildProjectPDFContentStream(
	lines []string,
	x float64,
	startY float64,
	lineHeight float64,
	fontSize float64,
	style resolvedProjectPDFStyle,
) []byte {
	var content strings.Builder

	if style.DarkTheme {
		content.WriteString(fmt.Sprintf(
			"%.3f %.3f %.3f rg\n0 0 %.0f %.0f re f\n",
			style.BackgroundColor[0],
			style.BackgroundColor[1],
			style.BackgroundColor[2],
			projectPDFPageWidth,
			projectPDFPageHeight,
		))
	}

	content.WriteString("BT\n")
	currentY := startY
	for lineIndex, line := range lines {
		trimmedLine := strings.TrimSpace(line)
		if trimmedLine == "" {
			currentY -= lineHeight
			continue
		}

		fontAlias, lineFontSize, lineColor := resolveProjectPDFLineStyle(
			lineIndex,
			trimmedLine,
			fontSize,
			style,
		)

		content.WriteString(fmt.Sprintf("/%s %.2f Tf\n", fontAlias, lineFontSize))
		content.WriteString(fmt.Sprintf(
			"%.3f %.3f %.3f rg\n",
			lineColor[0],
			lineColor[1],
			lineColor[2],
		))
		content.WriteString(fmt.Sprintf(
			"1 0 0 1 %.2f %.2f Tm (%s) Tj\n",
			x,
			currentY,
			escapeProjectPDFText(line),
		))
		currentY -= lineHeight
	}
	content.WriteString("ET")

	return []byte(content.String())
}

func resolveProjectPDFLineStyle(
	lineIndex int,
	line string,
	defaultFontSize float64,
	style resolvedProjectPDFStyle,
) (string, float64, [3]float64) {
	if lineIndex == 0 {
		return "F2", 16.0, style.HeadingColor
	}

	if isProjectPDFSectionHeading(line) {
		return "F2", 11.0, style.HeadingColor
	}

	if strings.HasPrefix(strings.ToLower(line), "gerado em:") ||
		strings.HasPrefix(strings.ToLower(line), "estilo do sistema:") {
		return "F1", 9.0, style.MutedColor
	}

	return "F1", defaultFontSize, style.BodyColor
}

func isProjectPDFSectionHeading(line string) bool {
	switch strings.ToUpper(strings.TrimSpace(line)) {
	case "RESUMO", "CLIENTES", "RECEITAS", "COBRANCAS MENSAIS", "PLANEJAMENTO (FASES, SUB-FASES E TAREFAS)":
		return true
	default:
		return false
	}
}

func escapeProjectPDFText(value string) string {
	if strings.TrimSpace(value) == "" {
		return ""
	}

	encodedBytes := encodeProjectPDFTextBytes(value)
	if len(encodedBytes) == 0 {
		return ""
	}

	var builder strings.Builder
	builder.Grow(len(encodedBytes) * 2)

	for _, charByte := range encodedBytes {
		switch charByte {
		case '\\', '(', ')':
			builder.WriteString(fmt.Sprintf("\\%03o", charByte))
		case '\n', '\r', '\t':
			builder.WriteByte(' ')
		default:
			if charByte < 32 || charByte > 126 {
				builder.WriteString(fmt.Sprintf("\\%03o", charByte))
				continue
			}
			builder.WriteByte(charByte)
		}
	}

	return builder.String()
}

func encodeProjectPDFTextBytes(value string) []byte {
	encoded := make([]byte, 0, len(value))
	for _, char := range value {
		if char == '\n' || char == '\r' || char == '\t' {
			encoded = append(encoded, ' ')
			continue
		}

		charByte, ok := projectPDFRuneToWinANSIByte(char)
		if !ok {
			encoded = append(encoded, '?')
			continue
		}
		encoded = append(encoded, charByte)
	}

	return encoded
}

func projectPDFRuneToWinANSIByte(char rune) (byte, bool) {
	if char >= 32 && char <= 126 {
		return byte(char), true
	}

	if char >= 160 && char <= 255 {
		return byte(char), true
	}

	switch char {
	case '€':
		return 0x80, true
	case '‚':
		return 0x82, true
	case 'ƒ':
		return 0x83, true
	case '„':
		return 0x84, true
	case '…':
		return 0x85, true
	case '†':
		return 0x86, true
	case '‡':
		return 0x87, true
	case 'ˆ':
		return 0x88, true
	case '‰':
		return 0x89, true
	case 'Š':
		return 0x8A, true
	case '‹':
		return 0x8B, true
	case 'Œ':
		return 0x8C, true
	case 'Ž':
		return 0x8E, true
	case '‘':
		return 0x91, true
	case '’':
		return 0x92, true
	case '“':
		return 0x93, true
	case '”':
		return 0x94, true
	case '•':
		return 0x95, true
	case '–':
		return 0x96, true
	case '—':
		return 0x97, true
	case '˜':
		return 0x98, true
	case '™':
		return 0x99, true
	case 'š':
		return 0x9A, true
	case '›':
		return 0x9B, true
	case 'œ':
		return 0x9C, true
	case 'ž':
		return 0x9E, true
	case 'Ÿ':
		return 0x9F, true
	default:
		return 0, false
	}
}

func wrapProjectPDFLines(lines []string, maxChars int) []string {
	if maxChars < 10 {
		maxChars = 10
	}

	wrapped := make([]string, 0, len(lines))
	for _, line := range lines {
		wrapped = append(wrapped, wrapProjectPDFLine(line, maxChars)...)
	}

	return wrapped
}

func wrapProjectPDFLine(line string, maxChars int) []string {
	if utf8.RuneCountInString(line) <= maxChars {
		return []string{line}
	}

	leadingSpaces := countProjectPDFLeadingSpaces(line)
	indent := strings.Repeat(" ", leadingSpaces)
	content := strings.TrimSpace(line)
	if content == "" {
		return []string{line}
	}

	words := strings.Fields(content)
	if len(words) == 0 {
		return []string{line}
	}

	result := make([]string, 0, (utf8.RuneCountInString(line)/maxChars)+1)
	current := indent + words[0]
	currentLen := utf8.RuneCountInString(current)

	for _, word := range words[1:] {
		wordLen := utf8.RuneCountInString(word)
		if currentLen+1+wordLen <= maxChars {
			current += " " + word
			currentLen += 1 + wordLen
			continue
		}
		result = append(result, current)
		current = indent + word
		currentLen = utf8.RuneCountInString(current)
	}
	result = append(result, current)

	return result
}

func countProjectPDFLeadingSpaces(value string) int {
	count := 0
	for _, char := range value {
		if char != ' ' {
			break
		}
		count++
	}

	return count
}

func fallbackProjectText(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "-"
	}

	return trimmed
}

func formatProjectDate(value *time.Time) string {
	if value == nil {
		return "-"
	}

	return value.Format("02/01/2006")
}

func formatProjectLifecycleLabel(value string) string {
	if strings.ToLower(strings.TrimSpace(value)) == "recorrente" {
		return "Recorrente"
	}

	return "Temporario"
}

func formatProjectActiveLabel(active bool) string {
	if active {
		return "Ativo"
	}

	return "Inativo"
}

func formatProjectYesNo(value bool) string {
	if value {
		return "Sim"
	}

	return "Nao"
}

func formatProjectRevenueStatus(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "recebido":
		return "Recebido"
	case "cancelado":
		return "Cancelado"
	default:
		return "Pendente"
	}
}

func formatProjectTaskStatus(value string) string {
	switch normalizeProjectTaskStatusForExport(value) {
	case "concluida":
		return "Concluida"
	case "iniciada":
		return "Iniciada"
	case "cancelada":
		return "Cancelada"
	default:
		return "Planejada"
	}
}

func formatProjectPlanningKind(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "phase":
		return "FASE"
	case "subphase":
		return "SUB-FASE"
	default:
		return "TAREFA"
	}
}

func formatProjectPlanningIcon(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "phase":
		return "F"
	case "subphase":
		return "S"
	default:
		return "T"
	}
}

func formatProjectPDFFontLabel(font string) string {
	switch normalizeProjectPDFFont(font) {
	case "metrophobic":
		return "Metrophobic"
	case "parkinsans":
		return "Parkinsans"
	case "antic":
		return "Antic"
	case "ubuntu-sans":
		return "Ubuntu Sans"
	case "anaheim":
		return "Anaheim"
	case "arima":
		return "Arima"
	case "bellota":
		return "Bellota"
	default:
		return "Quicksand"
	}
}

func formatProjectPDFThemeLabel(theme string) string {
	if strings.ToLower(strings.TrimSpace(theme)) == "dark" {
		return "Escuro"
	}

	return "Claro"
}

func maxProjectInt(left, right int) int {
	if left > right {
		return left
	}

	return right
}
