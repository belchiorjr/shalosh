"use client";

import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Radio, RadioGroup } from "@heroui/radio";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

import { MaterialSymbol } from "@/components/material-symbol";
import {
  applySystemFont,
  applySystemBackground,
  DEFAULT_SYSTEM_FONT,
  DEFAULT_SYSTEM_BACKGROUND,
  loadSystemSettings,
  persistSystemSettings,
  resolveSystemFont,
  resolveThemeMode,
  SYSTEM_BACKGROUND_PRESETS,
  SYSTEM_FONT_PRESETS,
  type AdminSystemFont,
  type AdminThemeMode,
} from "./system-settings";

interface UserSettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function UserSettingsModal({
  isOpen,
  onOpenChange,
}: UserSettingsModalProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<AdminThemeMode>("light");
  const [selectedFont, setSelectedFont] =
    useState<AdminSystemFont>(DEFAULT_SYSTEM_FONT);
  const [selectedBackground, setSelectedBackground] = useState<string>(
    DEFAULT_SYSTEM_BACKGROUND,
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const settings = loadSystemSettings(resolveThemeMode(resolvedTheme));
    setSelectedTheme(settings.theme);
    setSelectedFont(settings.font);
    setSelectedBackground(settings.background);
  }, [isOpen, resolvedTheme]);

  const previewStyle = useMemo(
    () => {
      const baseColor = selectedTheme === "dark" ? "#020617" : "#f8fafc";
      const overlayColor =
        selectedTheme === "dark"
          ? "rgba(2, 6, 23, 0.50)"
          : "rgba(248, 250, 252, 0.45)";

      return {
        backgroundColor: baseColor,
        backgroundImage: `linear-gradient(${overlayColor}, ${overlayColor}), ${selectedBackground}`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily:
          SYSTEM_FONT_PRESETS.find((preset) => preset.id === selectedFont)?.value ||
          SYSTEM_FONT_PRESETS[0].value,
      };
    },
    [selectedBackground, selectedFont, selectedTheme],
  );

  const handleThemeChange = (value: string) => {
    const theme = resolveThemeMode(value);
    setSelectedTheme(theme);
    setTheme(theme);
    persistSystemSettings({
      theme,
      font: selectedFont,
      background: selectedBackground,
    });
  };

  const handleFontChange = (value: string) => {
    const font = resolveSystemFont(value);
    setSelectedFont(font);
    applySystemFont(font);
    persistSystemSettings({
      theme: selectedTheme,
      font,
      background: selectedBackground,
    });
  };

  const applyBackground = (background: string) => {
    setSelectedBackground(background);
    applySystemBackground(background);
    persistSystemSettings({
      theme: selectedTheme,
      font: selectedFont,
      background,
    });
  };

  const handleUploadBackground = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        return;
      }
      applyBackground(`url("${result}")`);
    };
    reader.readAsDataURL(file);
  };

  const handleResetBackground = () => {
    applyBackground(DEFAULT_SYSTEM_BACKGROUND);
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="3xl"
      placement="center"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(closeModal) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-2">
                <MaterialSymbol name="settings" className="text-[22px] text-primary" />
                Configurações do Sistema
              </span>
            </ModalHeader>

            <ModalBody className="gap-6">
              <section className="space-y-3">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                  <MaterialSymbol name="light_mode" className="text-[16px]" />
                  Tema
                </p>
                <RadioGroup
                  orientation="horizontal"
                  value={selectedTheme}
                  onValueChange={handleThemeChange}
                >
                  <Radio value="light">
                    <span className="inline-flex items-center gap-1.5">
                      <MaterialSymbol name="light_mode" className="text-[18px]" />
                      Claro
                    </span>
                  </Radio>
                  <Radio value="dark">
                    <span className="inline-flex items-center gap-1.5">
                      <MaterialSymbol name="dark_mode" className="text-[18px]" />
                      Escuro
                    </span>
                  </Radio>
                </RadioGroup>
              </section>

              <section className="space-y-3">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                  <MaterialSymbol name="text_fields" className="text-[16px]" />
                  Fonte do sistema
                </p>

                <div className="grid gap-2 sm:grid-cols-2">
                  {SYSTEM_FONT_PRESETS.map((fontPreset) => {
                    const isSelected = selectedFont === fontPreset.id;
                    return (
                      <button
                        key={fontPreset.id}
                        type="button"
                        onClick={() => handleFontChange(fontPreset.id)}
                        className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-default-200 bg-content1/95 hover:border-default-300"
                        }`}
                      >
                        <p
                          className="text-sm font-semibold text-foreground"
                          style={{ fontFamily: fontPreset.value }}
                        >
                          {fontPreset.label}
                        </p>
                        <p
                          className="text-xs text-foreground/70"
                          style={{ fontFamily: fontPreset.value }}
                        >
                          Aa Bb Cc 123
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                    <MaterialSymbol name="image" className="text-[16px]" />
                    Fundo do sistema
                  </p>
                  <Button
                    size="sm"
                    variant="light"
                    startContent={
                      <MaterialSymbol name="restart_alt" className="text-[18px]" />
                    }
                    onPress={handleResetBackground}
                  >
                    Restaurar padrão
                  </Button>
                </div>

                <div className="max-h-[15rem] overflow-y-auto pr-1">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {SYSTEM_BACKGROUND_PRESETS.map((preset) => {
                      const isSelected = selectedBackground === preset.value;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyBackground(preset.value)}
                          className={`rounded-xl border p-2 text-left transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-default-200 bg-content1/95 hover:border-default-300"
                          }`}
                        >
                          <div
                            className="h-16 rounded-lg border border-white/25"
                            style={{
                              backgroundImage: preset.value,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          />
                          <p className="mt-2 text-xs font-semibold text-foreground/80">
                            {preset.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-dashed border-default-300 bg-default-50 p-3">
                  <label className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/80">
                    <MaterialSymbol name="upload" className="text-[16px]" />
                    Enviar imagem de fundo
                  </label>
                  <input
                    className="mt-2 block w-full cursor-pointer rounded-lg border border-default-200 bg-content1/95 px-3 py-2 text-xs text-foreground/80 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary"
                    type="file"
                    accept="image/*"
                    onChange={handleUploadBackground}
                  />
                </div>

                <div className="rounded-xl border border-default-200 p-2">
                  <p className="inline-flex items-center gap-1.5 px-2 text-xs font-medium text-foreground/80">
                    <MaterialSymbol name="image" className="text-[16px]" />
                    Pré-visualização
                  </p>
                  <div className="mt-2 h-28 overflow-hidden rounded-lg border border-default-200/70" style={previewStyle}>
                    <div className="space-y-2 p-3">
                      <div className="h-3 w-28 rounded bg-content1/70 backdrop-blur-md" />
                      <div className="h-2 w-20 rounded bg-content1/60 backdrop-blur-md" />
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="h-8 rounded-md bg-content1/65 backdrop-blur-md" />
                        <div className="h-8 rounded-md bg-content1/65 backdrop-blur-md" />
                        <div className="h-8 rounded-md bg-content1/65 backdrop-blur-md" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </ModalBody>

            <ModalFooter>
              <Button
                variant="light"
                startContent={<MaterialSymbol name="close" className="text-[18px]" />}
                onPress={closeModal}
              >
                Fechar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
