<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { ColumnDef, Row } from '~/types/configurable-table';

const props = defineProps<{
  tableId: string;
  columns: ColumnDef[];
  rows: Row[];
  // сортировка
  initialSort?: { key: string; dir: 'asc' | 'desc' };
  // уникальный ключ строки (обязательно укажи, иначе падём на индекс)
  rowKey?: string | ((_row: Row) => string | number);

  // === ПОИСК через props ===
  searchQuery?: string;
  searchKeys?: string[]; // по каким полям искать; по умолчанию — по всем колонкам
  caseSensitive?: boolean;
  customFilter?: (_row: Row, _q: string) => boolean; // если нужно переопределить логику
}>();

const emit = defineEmits<{
  (_event: 'selectionChange', _payload: { selectedKeys: Array<string | number> }): void;
  (_event: 'rowClick', _payload: { row: Row; key: string | number }): void;
}>();

// ---------- Search query (internal state)
const searchQuery = ref(props.searchQuery || '');

// ---------- Column visibility and order (persist in localStorage)
const STORAGE_KEY = `table.columns:${props.tableId}`;
const STORAGE_ORDER_KEY = `table.columns.order:${props.tableId}`;
const columnState = ref<Record<string, boolean>>({});
const columnOrder = ref<string[]>([]);

function initColumnState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) columnState.value = JSON.parse(raw);
    else {
      columnState.value = Object.fromEntries(props.columns.map(c => [c.key, c.visible ?? true]));
    }
  } catch {
    columnState.value = Object.fromEntries(props.columns.map(c => [c.key, c.visible ?? true]));
  }

  // Initialize column order
  try {
    const orderRaw = localStorage.getItem(STORAGE_ORDER_KEY);
    if (orderRaw) {
      columnOrder.value = JSON.parse(orderRaw);
      // Ensure all columns are in the order array
      const allKeys = props.columns.map(c => c.key);
      const missingKeys = allKeys.filter(key => !columnOrder.value.includes(key));
      columnOrder.value = [...columnOrder.value, ...missingKeys];
    } else {
      columnOrder.value = props.columns.map(c => c.key);
    }
  } catch {
    columnOrder.value = props.columns.map(c => c.key);
  }
}
initColumnState();

watch(
  columnState,
  v => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  },
  { deep: true }
);

watch(
  columnOrder,
  v => {
    localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(v));
  },
  { deep: true }
);

const allColumns = computed<ColumnDef[]>(() => {
  // Sort columns according to the saved order
  return [...props.columns].sort((a, b) => {
    const indexA = columnOrder.value.indexOf(a.key);
    const indexB = columnOrder.value.indexOf(b.key);
    return indexA - indexB;
  });
});

const visibleColumns = computed<ColumnDef[]>(() => 
  allColumns.value.filter(c => columnState.value[c.key] !== false)
);

const hiddenColumns = computed<ColumnDef[]>(() => 
  allColumns.value.filter(c => columnState.value[c.key] === false)
);

// ---------- helpers
function keyOf(row: Row, idx: number): string | number {
  if (typeof props.rowKey === 'function') return props.rowKey(row);
  if (typeof props.rowKey === 'string' && row[props.rowKey] != null) return row[props.rowKey];
  // ⚠️ Фолбэк на индекс — нестабилен при сортировке/фильтре; лучше всегда передавать rowKey
  return idx;
}

function cellValue(col: ColumnDef, row: Row) {
  const raw = row[col.key];
  return col.formatter ? col.formatter(raw, row) : raw;
}

// ---------- SEARCH / FILTER
const normalizedQuery = computed(() => searchQuery.value.toString());
const filterKeys = computed(() =>
  props.searchKeys && props.searchKeys.length ? props.searchKeys : allColumns.value.map(c => c.key)
);

const filteredRows = computed<Row[]>(() => {
  const q = normalizedQuery.value;
  if (!q) return props.rows;
  if (props.customFilter) return props.rows.filter(r => props.customFilter!(r, q));

  const query = props.caseSensitive ? q : q.toLowerCase();
  return props.rows.filter(row => {
    for (const k of filterKeys.value) {
      const v = row[k];
      if (v == null) continue;
      const s = props.caseSensitive ? String(v) : String(v).toLowerCase();
      if (s.includes(query)) return true;
    }
    return false;
  });
});

// ---------- SORT
const sortKey = ref(props.initialSort?.key ?? '');
const sortDir = ref<'asc' | 'desc'>(props.initialSort?.dir ?? 'asc');

function sortBy(col: ColumnDef) {
  if (!col.sortable) return;
  if (sortKey.value === col.key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = col.key;
    sortDir.value = 'asc';
  }
}

const displayRows = computed(() => {
  if (!sortKey.value) return filteredRows.value;
  const dir = sortDir.value === 'asc' ? 1 : -1;
  const key = sortKey.value;
  return [...filteredRows.value].sort((a, b) => {
    const va = a[key],
      vb = b[key];
    if (va == null && vb == null) return 0;
    if (va == null) return -1 * dir;
    if (vb == null) return 1 * dir;
    return va > vb ? dir : va < vb ? -dir : 0;
  });
});

// ---------- Column config dropdown
const isConfigOpen = ref(false);
const configRef = ref<HTMLElement | null>(null);
function onBodyClick(e: MouseEvent) {
  if (!configRef.value) return;
  if (!configRef.value.contains(e.target as Node)) isConfigOpen.value = false;
}
if (typeof window !== 'undefined') window.addEventListener('click', onBodyClick);

// ---------- Row expand (по ключам)
const expandedKeys = ref<Set<string | number>>(new Set());
function toggleRowExpand(key: string | number) {
  if (expandedKeys.value.has(key)) expandedKeys.value.delete(key);
  else expandedKeys.value.add(key);
}
function isExpanded(key: string | number) {
  return expandedKeys.value.has(key);
}

// ---------- Row click handler
function handleRowClick(row: Row, key: string | number, event: MouseEvent) {
  // Don't expand if clicking on checkbox
  const target = event.target as HTMLElement;
  if (target instanceof HTMLInputElement && target.type === 'checkbox') return;

  // If no hidden columns, just emit row click event
  if (hiddenColumns.value.length === 0) {
    emit('rowClick', { row, key });
    return;
  }

  // Otherwise toggle expansion
  toggleRowExpand(key);
}

// ---------- SELECTION (чекбоксы)
const selectedKeys = ref<Set<string | number>>(new Set());
watch(
  selectedKeys,
  () => {
    emit('selectionChange', { selectedKeys: Array.from(selectedKeys.value) });
  },
  { deep: true }
);

// ключи только видимых строк (после фильтра и сортировки)
const visibleKeys = computed(() => displayRows.value.map((r, i) => keyOf(r, i)));

const selectedVisibleCount = computed(() => visibleKeys.value.filter(k => selectedKeys.value.has(k)).length);

const allVisibleSelected = computed(
  () => visibleKeys.value.length > 0 && selectedVisibleCount.value === visibleKeys.value.length
);
const someVisibleSelected = computed(() => selectedVisibleCount.value > 0 && !allVisibleSelected.value);

function toggleSelectRow(key: string | number, checked: boolean) {
  if (checked) selectedKeys.value.add(key);
  else selectedKeys.value.delete(key);
}

function toggleSelectAllVisible(checked: boolean) {
  if (checked) {
    for (const k of visibleKeys.value) selectedKeys.value.add(k);
  } else {
    for (const k of visibleKeys.value) selectedKeys.value.delete(k);
  }
}

function onColumnChange(key: string, checked: boolean) {
  columnState.value[key] = checked;
}

// ---------- Drag and Drop functionality
const draggedColumn = ref<string | null>(null);
const dragOverColumn = ref<string | null>(null);

function handleDragStart(event: DragEvent, columnKey: string) {
  draggedColumn.value = columnKey;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', columnKey);
  }
}

function handleDragOver(event: DragEvent, columnKey: string) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  dragOverColumn.value = columnKey;
}

function handleDragLeave(event: DragEvent) {
  // Only clear if we're leaving the entire header area
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;
  
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    dragOverColumn.value = null;
  }
}

function handleDrop(event: DragEvent, targetColumnKey: string) {
  event.preventDefault();
  
  if (!draggedColumn.value || draggedColumn.value === targetColumnKey) {
    draggedColumn.value = null;
    dragOverColumn.value = null;
    return;
  }

  const currentOrder = [...columnOrder.value];
  const draggedIndex = currentOrder.indexOf(draggedColumn.value);
  const targetIndex = currentOrder.indexOf(targetColumnKey);

  if (draggedIndex !== -1 && targetIndex !== -1) {
    // Remove dragged column from its current position
    currentOrder.splice(draggedIndex, 1);
    
    // Insert it at the new position
    const newTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    currentOrder.splice(newTargetIndex, 0, draggedColumn.value);
    
    columnOrder.value = currentOrder;
  }

  draggedColumn.value = null;
  dragOverColumn.value = null;
}

function handleDragEnd() {
  draggedColumn.value = null;
  dragOverColumn.value = null;
}

// ---------- Helper functions for styling
function getCellClass(col: ColumnDef, row: Row) {
  const classes = [];

  // Add status-specific classes
  if (col.key === 'status') {
    const status = String(row[col.key]).toLowerCase();
    if (status.includes('հաստատված') || status.includes('confirmed')) {
      classes.push('transaction-table__td--status-confirmed');
    } else if (status.includes('չհաստատված') || status.includes('unconfirmed')) {
      classes.push('transaction-table__td--status-unconfirmed');
    } else if (status.includes('միջանկյալ') || status.includes('intermediate')) {
      classes.push('transaction-table__td--status-intermediate');
    } else if (status.includes('վերջնական') || status.includes('final')) {
      classes.push('transaction-table__td--status-final');
    } else if (status.includes('հեռացված') || status.includes('removed')) {
      classes.push('transaction-table__td--status-removed');
    } else if (status.includes('փոփ') || status.includes('change')) {
      classes.push('transaction-table__td--status-changeable');
    }
  }

  return classes.join(' ');
}
</script>

<template>
  <div class="transaction-table">
    <!-- Header with search and controls -->
    <div class="transaction-table__header">
      <div class="transaction-table__search">
        <input v-model="searchQuery" type="text" placeholder="Փնտրել..." class="transaction-table__search-input" />
      </div>

      <div class="transaction-table__controls">
        <button class="transaction-table__control-btn transaction-table__control-btn--download">
          <svg class="transaction-table__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>

        <div ref="configRef" class="transaction-table__config">
          <button
            class="transaction-table__control-btn transaction-table__control-btn--config"
            :class="{ 'transaction-table__control-btn--active': isConfigOpen }"
            @click.stop="isConfigOpen = !isConfigOpen"
          >
            <svg class="transaction-table__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
            </svg>
            Կարգավորել
          </button>

          <div v-if="isConfigOpen" class="transaction-table__config-dropdown" @click.stop>
            <div class="transaction-table__config-title">Սյունակներ</div>
            <label v-for="c in allColumns" :key="c.key" class="transaction-table__config-item">
              <input
                class="transaction-table__config-checkbox"
                type="checkbox"
                :checked="columnState[c.key] !== false"
                @change="onColumnChange(c.key, ($event.target as HTMLInputElement).checked)"
              />
              <span class="transaction-table__config-label">{{ c.label }}</span>
            </label>
            <div class="transaction-table__config-note">* Թաքնված սյունակները կտեսնեք տողի մանրամասներում</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="transaction-table__container">
      <table class="transaction-table__table">
        <thead class="transaction-table__thead">
          <tr class="transaction-table__header-row">
            <!-- Select-All -->
            <th class="transaction-table__th transaction-table__th--checkbox">
              <input
                type="checkbox"
                class="transaction-table__checkbox"
                :checked="allVisibleSelected"
                :indeterminate.prop="someVisibleSelected"
                @change="toggleSelectAllVisible(($event.target as HTMLInputElement).checked)"
              />
            </th>

            <th
              v-for="col in visibleColumns"
              :key="col.key"
              class="transaction-table__th"
              :class="{ 
                'transaction-table__th--sortable': col.sortable,
                'transaction-table__th--dragging': draggedColumn === col.key,
                'transaction-table__th--drag-over': dragOverColumn === col.key
              }"
              :style="{ width: col.width || 'auto', textAlign: col.align || 'left' }"
              draggable="true"
              @click="sortBy(col)"
              @dragstart="handleDragStart($event, col.key)"
              @dragover="handleDragOver($event, col.key)"
              @dragleave="handleDragLeave($event)"
              @drop="handleDrop($event, col.key)"
              @dragend="handleDragEnd"
            >
              <span class="transaction-table__th-content">
                <svg 
                  class="transaction-table__drag-handle" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor"
                >
                  <path d="M8 6h8M8 12h8M8 18h8"/>
                </svg>
                {{ col.label }}
                <span 
                  v-if="sortKey === col.key" 
                  class="transaction-table__sort-icon"
                  :class="{ 'transaction-table__sort-icon--desc': sortDir === 'desc' }"
                >
                  ▲
                </span>
              </span>
            </th>
          </tr>
        </thead>

        <tbody class="transaction-table__tbody">
          <template v-for="(row, idx) in displayRows" :key="keyOf(row, idx)">
            <tr
              class="transaction-table__row"
              :class="{ 'transaction-table__row--expanded': isExpanded(keyOf(row, idx)) }"
              @click="handleRowClick(row, keyOf(row, idx), $event)"
            >
              <!-- Row checkbox -->
              <td class="transaction-table__td transaction-table__td--checkbox">
                <input
                  type="checkbox"
                  class="transaction-table__checkbox"
                  :checked="selectedKeys.has(keyOf(row, idx))"
                  @change="toggleSelectRow(keyOf(row, idx), ($event.target as HTMLInputElement).checked)"
                />
              </td>

              <td
                v-for="col in visibleColumns"
                :key="col.key"
                class="transaction-table__td"
                :class="getCellClass(col, row)"
                :style="{ textAlign: col.align || 'left' }"
              >
                <span class="transaction-table__cell-content">
                  {{ cellValue(col, row) }}
                </span>
              </td>
            </tr>

            <!-- Details: show hidden columns -->
            <tr v-if="isExpanded(keyOf(row, idx))" class="transaction-table__details-row">
              <td class="transaction-table__td"></td>
              <td :colspan="visibleColumns.length" class="transaction-table__td transaction-table__td--details">
                <div class="transaction-table__details">
                  <div v-for="col in hiddenColumns" :key="col.key" class="transaction-table__detail-item">
                    <div class="transaction-table__detail-label">{{ col.label }}</div>
                    <div class="transaction-table__detail-value">
                      {{ cellValue(col, row) }}
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.transaction-table {
  width: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
  }

  &__search {
    flex: 1;
    max-width: 300px;
  }

  &__search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    background: white;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    &::placeholder {
      color: #9ca3af;
    }
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__control-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    color: #374151;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    &--download {
      padding: 8px;
    }

    &--config {
      &.transaction-table__control-btn--active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }
    }
  }

  &__icon {
    width: 16px;
    height: 16px;
    stroke-width: 2;
  }

  &__config {
    position: relative;
  }

  &__config-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    width: 280px;
    max-height: 320px;
    overflow-y: auto;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    z-index: 50;
    padding: 12px;
  }

  &__config-title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: #6b7280;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e7eb;
  }

  &__config-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background: #f9fafb;
    }
  }

  &__config-checkbox {
    cursor: pointer;
  }

  &__config-label {
    font-size: 14px;
    color: #374151;
  }

  &__config-note {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
    font-size: 12px;
    color: #6b7280;
  }

  &__container {
    overflow-x: auto;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  &__thead {
    background: #f8f9fa;
  }

  &__header-row {
    border-bottom: 2px solid #e5e7eb;
  }

  &__th {
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-right: 1px solid #e5e7eb;
    white-space: nowrap;
    position: relative;
    transition: all 0.2s ease;

    &:last-child {
      border-right: none;
    }

    &--checkbox {
      width: 50px;
      text-align: center;
    }

    &--sortable {
      cursor: pointer;
      user-select: none;

      &:hover {
        background: #f1f5f9;
      }
    }

    &--dragging {
      opacity: 0.5;
      background: #e0f2fe;
      transform: rotate(2deg);
      z-index: 1000;
    }

    &--drag-over {
      background: #dbeafe;
      border-left: 3px solid #3b82f6;
      border-right: 3px solid #3b82f6;
    }

    &:hover {
      .transaction-table__drag-handle {
        opacity: 1;
      }
    }
  }

  &__th-content {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__drag-handle {
    width: 12px;
    height: 12px;
    opacity: 0.3;
    cursor: grab;
    transition: opacity 0.2s;
    margin-right: 4px;

    &:active {
      cursor: grabbing;
    }
  }

  &__sort-icon {
    font-size: 12px;
    color: #6b7280;
    transition: transform 0.2s;

    &--desc {
      transform: rotate(180deg);
    }
  }

  &__tbody {
    background: white;
  }

  &__row {
    border-bottom: 1px solid #e5e7eb;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background: #f8f9fa;
    }

    &--expanded {
      background: #f0f9ff;
    }
  }

  &__td {
    padding: 12px 16px;
    border-right: 1px solid #e5e7eb;
    vertical-align: middle;

    &:last-child {
      border-right: none;
    }

    &--checkbox {
      width: 50px;
      text-align: center;
    }

    &--details {
      padding: 0;
      background: #f8f9fa;
    }

    // Status-specific styling
    &--status-confirmed {
      .transaction-table__cell-content {
        display: inline-block;
        padding: 4px 8px;
        background: #dcfce7;
        color: #166534;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
    }

    &--status-unconfirmed {
      .transaction-table__cell-content {
        display: inline-block;
        padding: 4px 8px;
        background: #fee2e2;
        color: #dc2626;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
    }

    &--status-intermediate {
      .transaction-table__cell-content {
        display: inline-block;
        padding: 4px 8px;
        background: #dbeafe;
        color: #1d4ed8;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
    }

    &--status-final {
      .transaction-table__cell-content {
        display: inline-block;
        padding: 4px 8px;
        background: #e0e7ff;
        color: #3730a3;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
    }

    &--status-removed {
      .transaction-table__cell-content {
        display: inline-block;
        padding: 4px 8px;
        background: #f3f4f6;
        color: #6b7280;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
    }

    &--status-changeable {
      .transaction-table__cell-content {
        display: inline-block;
        padding: 4px 8px;
        background: #fef3c7;
        color: #d97706;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
    }
  }

  &__cell-content {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__checkbox {
    cursor: pointer;
    width: 16px;
    height: 16px;
  }

  &__details-row {
    background: #f8f9fa;
  }

  &__details {
    padding: 20px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  }

  &__detail-item {
    background: white;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  &__detail-label {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 4px;
    font-weight: 500;
  }

  &__detail-value {
    font-size: 14px;
    color: #374151;
    font-weight: 500;
    word-break: break-all;
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .transaction-table {
    &__header {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }

    &__search {
      max-width: none;
    }

    &__controls {
      justify-content: flex-end;
    }

    &__details {
      grid-template-columns: 1fr;
    }
  }
}
</style>
