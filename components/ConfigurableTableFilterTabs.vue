<script setup lang="ts">
import { computed } from 'vue';
import type { Row } from '~/types/configurable-table';

const props = defineProps<{
  rows: Row[];
  filterKey: string;
  // 'single' | 'multi'
  mode?: 'single' | 'multi';
  allLabel?: string;
  allValue?: string | number;
  // v-model:activeFilters
  activeFilters?: Array<string | number>;
}>();

const emit = defineEmits<{
  (_event: 'update:activeFilters', _payload: Array<string | number>): void;
}>();

const ALL = computed(() => props.allValue ?? '__ALL__');
const allLabel = computed(() => props.allLabel ?? 'Բոլորը');
const mode = computed(() => props.mode ?? 'single');

const uniqueValues = computed<string[]>(() => {
  const set = new Set<string>();
  for (const r of props.rows) {
    const v = (r as any)[props.filterKey];
    if (v != null && v !== '') set.add(String(v));
  }
  return Array.from(set);
});

const tabs = computed<{ value: string; label: string }[]>(() => [
  { value: String(ALL.value), label: allLabel.value },
  ...uniqueValues.value.map(v => ({ value: v, label: v })),
]);

function isActive(v: string): boolean {
  const list = props.activeFilters ?? [];
  return list.includes(v);
}

function setAll() {
  emit('update:activeFilters', [ALL.value]);
}

function onClickSingle(v: string) {
  if (v === ALL.value) {
    setAll();
    return;
  }
  emit('update:activeFilters', [v]);
}

function onClickMulti(v: string) {
  if (v === ALL.value) {
    // If All already active, ignore (not toggle)
    if (isActive(String(ALL.value))) return;
    setAll();
    return;
  }

  const set = new Set(props.activeFilters ?? []);
  set.delete(ALL.value);
  if (set.has(v)) set.delete(v);
  else set.add(v);

  const selected = Array.from(set);
  if (selected.length === 0) {
    setAll();
    return;
  }
  if (selected.length === uniqueValues.value.length) {
    setAll();
    return;
  }
  emit('update:activeFilters', selected);
}

function onTabClick(v: string) {
  if (mode.value === 'single') onClickSingle(v);
  else onClickMulti(v);
}
</script>

<template>
  <div class="configurable-tabs" role="tablist" aria-label="External filter tabs">
    <button
      v-for="t in tabs"
      :key="t.value"
      class="configurable-tabs__tab"
      :class="{ 'configurable-tabs__tab--active': isActive(t.value) }"
      type="button"
      role="tab"
      :aria-selected="isActive(t.value) ? 'true' : 'false'"
      @click="onTabClick(t.value)"
    >
      {{ t.label }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.configurable-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;

  &__tab {
    padding: 6px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    background: #ffffff;
    color: #374151;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }

    &--active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }
  }
}
</style>
