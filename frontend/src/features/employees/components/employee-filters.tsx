"use client";

import { FilterXIcon } from "lucide-react";

import { MultiSelectFilter } from "@/components/multi-select-filter";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { getCountryName } from "@/lib/format";

import { STATUS_FILTER_OPTIONS } from "../display";
import { SEARCH_MAX_LENGTH } from "../list-params";
import type { EmployeeListFilters, EmployeeOptions, EmployeeStatusFilter } from "../types";

interface EmployeeFiltersProps {
  filters: EmployeeListFilters;
  options: EmployeeOptions | undefined;
  hasActiveFilters: boolean;
  onChange: (change: Partial<EmployeeListFilters>) => void;
  onClear: () => void;
}

function toStatusFilters(values: string[]): EmployeeStatusFilter[] {
  return STATUS_FILTER_OPTIONS.filter((option) => values.includes(option.value)).map(
    (option) => option.value,
  );
}

export function EmployeeFilters({
  filters,
  options,
  hasActiveFilters,
  onChange,
  onClear,
}: EmployeeFiltersProps) {
  // Keep countries from the URL selectable even if no employee has them yet.
  const countryCodes = [
    ...new Set([...(options?.countriesInUse ?? []), ...filters.countryCodes]),
  ];
  const countryOptions = countryCodes
    .map((code) => ({ value: code, label: getCountryName(code) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const departmentOptions = (options?.departments ?? []).map((department) => ({
    value: department,
    label: department,
  }));

  return (
    <div
      role="search"
      aria-label="Filter employees"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:items-end xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]"
    >
      <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3 xl:col-span-1">
        <span aria-hidden="true" className="text-xs font-medium text-muted-foreground">
          Search
        </span>
        <SearchInput
          label="Search employees by name, email or employee ID"
          placeholder="Name, email or employee ID"
          value={filters.search}
          maxLength={SEARCH_MAX_LENGTH}
          onSearch={(search) => onChange({ search })}
        />
      </div>
      <MultiSelectFilter
        label="Country"
        allLabel="All countries"
        values={filters.countryCodes}
        options={countryOptions}
        disabled={!options}
        onChange={(countryCodes) => onChange({ countryCodes })}
      />
      <MultiSelectFilter
        label="Department"
        allLabel="All departments"
        values={filters.departments}
        options={departmentOptions}
        disabled={!options}
        onChange={(departments) => onChange({ departments })}
      />
      <MultiSelectFilter
        label="Employment status"
        allLabel="All statuses"
        values={filters.statuses}
        options={STATUS_FILTER_OPTIONS}
        onChange={(values) => onChange({ statuses: toStatusFilters(values) })}
      />
      <Button
        variant="ghost"
        className="justify-self-start sm:col-span-2 lg:col-span-3 xl:col-span-1"
        onClick={onClear}
        disabled={!hasActiveFilters}
      >
        <FilterXIcon aria-hidden="true" />
        Clear filters
      </Button>
    </div>
  );
}
