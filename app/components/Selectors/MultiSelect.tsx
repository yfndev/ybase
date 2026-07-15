"use client";

import { Check, ChevronsUpDown, Search } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
  keywords?: string;
}

interface Props<TOption extends MultiSelectOption> {
  id?: string;
  options: TOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  isLoading?: boolean;
  maxSelected?: number;
  renderOption?: (option: TOption) => ReactNode;
  renderValue?: (options: TOption[], selectedCount: number) => ReactNode;
}

export function MultiSelect<TOption extends MultiSelectOption>({
  id,
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder = "Suchen …",
  emptyMessage = "Keine passenden Einträge gefunden.",
  loadingMessage = "Einträge werden geladen …",
  isLoading = false,
  maxSelected = Number.POSITIVE_INFINITY,
  renderOption,
  renderValue,
}: Props<TOption>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedValues = useMemo(() => new Set(value), [value]);
  const optionsByValue = useMemo(
    () => new Map(options.map((option) => [option.value, option])),
    [options],
  );
  const selectedOptions = useMemo(
    () =>
      value.flatMap((selectedValue) => {
        const option = optionsByValue.get(selectedValue);
        return option ? [option] : [];
      }),
    [optionsByValue, value],
  );
  const visibleOptions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("de");
    if (!query) return options;
    return options.filter((option) =>
      (option.keywords ?? `${option.label} ${option.description ?? ""}`)
        .toLocaleLowerCase("de")
        .includes(query),
    );
  }, [options, search]);

  const toggleOption = (option: TOption) => {
    const isSelected = selectedValues.has(option.value);
    if (!isSelected && value.length >= maxSelected) return;
    onValueChange(
      isSelected
        ? value.filter((selectedValue) => selectedValue !== option.value)
        : [...value, option.value],
    );
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-haspopup="listbox"
          aria-expanded={open}
          className="min-h-12 h-auto w-full justify-between px-3 py-2 font-normal"
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            {value.length > 0
              ? (renderValue?.(selectedOptions, value.length) ??
                `${value.length} ausgewählt`)
              : placeholder}
          </span>
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <div className="relative border-b p-2">
          <Search className="pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="py-2 pr-3 pl-9"
            autoFocus
          />
        </div>
        <div className="max-h-72 overflow-y-auto">
          <div
            role="listbox"
            aria-label={placeholder}
            aria-multiselectable="true"
            className="space-y-1 p-2"
          >
            {isLoading ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                {loadingMessage}
              </p>
            ) : null}
            {!isLoading && visibleOptions.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </p>
            ) : null}
            {visibleOptions.map((option) => {
              const selected = selectedValues.has(option.value);
              const disabled = !selected && value.length >= maxSelected;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={disabled}
                  onClick={() => toggleOption(option)}
                  className="flex w-full items-center gap-3 px-2 py-2 text-left outline-none transition-colors hover:bg-accent focus-visible:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="min-w-0 flex-1">
                    {renderOption?.(option) ?? (
                      <>
                        <span className="block truncate text-sm font-medium">
                          {option.label}
                        </span>
                        {option.description ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        ) : null}
                      </>
                    )}
                  </span>
                  <span
                    aria-hidden="true"
                    className="grid size-5 shrink-0 place-items-center border-2 border-input data-[selected=true]:border-primary data-[selected=true]:bg-primary"
                    data-selected={selected}
                  >
                    {selected ? (
                      <Check className="size-3.5" strokeWidth={3} />
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
