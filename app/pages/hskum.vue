<script setup lang="ts">
import type { ColumnDef } from '~/types/configurable-table';

const columns: ColumnDef[] = [
  { key: 'date', label: 'Ամսաթիվ', sortable: true, width: '120px' },
  { key: 'number', label: 'Համար', sortable: true, width: '140px' },
  {
    key: 'amount',
    label: 'Գումար',
    sortable: true,
    align: 'right',
    width: '150px',
    formatter: (_v: number, row: any) => {
      const cur = row.currency || '';
      const val = Number(row.amount);
      if (Number.isNaN(val)) return '-';
      return `${Intl.NumberFormat('hy-AM', { maximumFractionDigits: 2 }).format(val)} ${cur}`;
    },
  },
  { key: 'payerAccount', label: 'Վճարողի հաշիվ', width: '180px' },
  { key: 'accountName', label: 'Հաշվի անվանում', width: '200px' },
  { key: 'recipient', label: 'Ստացող', sortable: true, width: '150px' },
  { key: 'recipientAccount', label: 'Ստացողի հաշիվ', width: '150px' },
  { key: 'status', label: 'Կարգավիճակ', sortable: true, width: '120px' },
  // Hidden columns for details
  { key: 'userName', label: 'Օգտվողի Անուն', visible: false },
  { key: 'equivalent', label: 'Համարժեք', visible: false },
  { key: 'exchangeRate', label: 'Փոխարժեք', visible: false },
  { key: 'commission', label: 'Միջնորդավճար', visible: false },
  { key: 'documentNumber', label: 'Փաստաթղթի Համար', visible: false },
  { key: 'recipientBank', label: 'Ստացողի Բանկ', visible: false },
  { key: 'file', label: 'Ֆայլ', visible: false },
  { key: 'urgent', label: 'Շտապ', visible: false },
  { key: 'purpose', label: 'Նպատակ', visible: false },
  { key: 'executionDate', label: 'Կատարման Ամսաթիվ', visible: false },
];

const rows = [
  {
    id: 'T-001',
    date: '03.03.25',
    number: '123456789',
    amount: 60312,
    currency: 'EUR',
    payerAccount: '1234567890123456',
    accountName: 'Հայաստանի Էլեկտրական...',
    recipient: 'Anna Kirakosyan',
    recipientAccount: '123456789012...',
    status: 'Հաստատված',
    userName: 'ENA1234',
    equivalent: 1628436.0,
    exchangeRate: 10.0,
    commission: 1002.0,
    documentNumber: '123456789012345',
    recipientBank: 'Ամերիաբանկ ՖԲԸ',
    file: '12345678546598798',
    urgent: 'Այո ✔',
    purpose: 'Փոխանցում Անձանական Հաշվի',
    executionDate: '12.03.25',
  },
  {
    id: 'T-002',
    date: '03.03.25',
    number: '987654321',
    amount: 1960672353.61,
    currency: 'AMD',
    payerAccount: '9876543210987654',
    accountName: 'Հայաստանի Գազ...',
    recipient: 'John Smith',
    recipientAccount: '987654321098...',
    status: 'Չհաստատված',
    userName: 'ENA1235',
    equivalent: 43250.0,
    exchangeRate: 10.0,
    commission: 50.0,
    documentNumber: '987654321098765',
    recipientBank: 'Հայաստանի Բանկ',
    file: '98765432109876543',
    urgent: 'Ոչ',
    purpose: 'Ապրանքների վճարում',
    executionDate: '15.03.25',
  },
  {
    id: 'T-003',
    date: '04.03.25',
    number: '456789123',
    amount: 108148950.8,
    currency: 'RUR',
    payerAccount: '4567891234567890',
    accountName: 'Հայաստանի Ջուր...',
    recipient: 'Maria Garcia',
    recipientAccount: '456789123456...',
    status: 'Միջանկյալ',
    userName: 'ENA1236',
    equivalent: 1500000.0,
    exchangeRate: 10.0,
    commission: 1500.0,
    documentNumber: '456789123456789',
    recipientBank: 'Արարատբանկ',
    file: '45678912345678901',
    urgent: 'Այո ✔',
    purpose: 'Ծառայությունների վճարում',
    executionDate: '18.03.25',
  },
  {
    id: 'T-004',
    date: '05.03.25',
    number: '789123456',
    amount: 1816444.9,
    currency: 'CNY',
    payerAccount: '7891234567890123',
    accountName: 'Հայաստանի Հեռահաղորդակցություն...',
    recipient: 'David Brown',
    recipientAccount: '789123456789...',
    status: 'Վերջնական',
    userName: 'ENA1237',
    equivalent: 250000.0,
    exchangeRate: 10.0,
    commission: 250.0,
    documentNumber: '789123456789012',
    recipientBank: 'ՎՏԲ Բանկ',
    file: '78912345678901234',
    urgent: 'Ոչ',
    purpose: 'Կոմունալ վճարում',
    executionDate: '20.03.25',
  },
  {
    id: 'T-005',
    date: '06.03.25',
    number: '321654987',
    amount: 44,
    currency: 'USD',
    payerAccount: '3216549876543210',
    accountName: 'Հայաստանի Փոստ...',
    recipient: 'Sarah Wilson',
    recipientAccount: '321654987654...',
    status: 'Հեռացված',
    userName: 'ENA1238',
    equivalent: 50000.0,
    exchangeRate: 10.0,
    commission: 50.0,
    documentNumber: '321654987654321',
    recipientBank: 'Ակբա Բանկ',
    file: '32165498765432109',
    urgent: 'Ոչ',
    purpose: 'Փոխանցում',
    executionDate: '22.03.25',
  },
  // extra rows to demonstrate page/selected totals
  {
    id: 'T-006',
    date: '06.03.25',
    number: '111222333',
    amount: 100,
    currency: 'USD',
    payerAccount: '1111222233334444',
    accountName: 'Թեստային հաշիվ...',
    recipient: 'Test User 1',
    recipientAccount: '111122223333...',
    status: 'Հաստատված',
    userName: 'ENA2001',
    equivalent: 1000.0,
    exchangeRate: 10.0,
    commission: 10.0,
    documentNumber: '111122223333444',
    recipientBank: 'Ամերիաբանկ',
    file: '11112222333344455',
    urgent: 'Ոչ',
    purpose: 'Թեստային վճարում',
    executionDate: '23.03.25',
  },
  {
    id: 'T-007',
    date: '07.03.25',
    number: '222333444',
    amount: 500,
    currency: 'EUR',
    payerAccount: '2222333344445555',
    accountName: 'Թեստային հաշիվ 2...',
    recipient: 'Test User 2',
    recipientAccount: '222233334444...',
    status: 'Չհաստատված',
    userName: 'ENA2002',
    equivalent: 5000.0,
    exchangeRate: 10.0,
    commission: 5.0,
    documentNumber: '222233334444555',
    recipientBank: 'Արարատբանկ',
    file: '22223333444455566',
    urgent: 'Այո ✔',
    purpose: 'Թեստային փոխանցում',
    executionDate: '24.03.25',
  },
  {
    id: 'T-008',
    date: '08.03.25',
    number: '333444555',
    amount: 100000,
    currency: 'AMD',
    payerAccount: '3333444455556666',
    accountName: 'Թեստային հաշիվ 3...',
    recipient: 'Test User 3',
    recipientAccount: '333344445555...',
    status: 'Միջանկյալ',
    userName: 'ENA2003',
    equivalent: 1000000.0,
    exchangeRate: 10.0,
    commission: 100.0,
    documentNumber: '333344445555666',
    recipientBank: 'ՎՏԲ Բանկ',
    file: '33334444555566677',
    urgent: 'Ոչ',
    purpose: 'Թեստային ծառայություն',
    executionDate: '25.03.25',
  },
];

function handleRowClick({ row, key }: { row: any; key: string | number }) {
  console.log('Row clicked:', { row, key });
}

const search = ref('');
const selected = ref<Array<string | number>>([]);
const selectedRows = ref<any[]>([]);

const currencyTotals = {
  EUR: 60312,
  AMD: 1960672353.61,
  RUR: 108148950.8,
  CNY: 1816444.9,
  USD: 44,
};

// ---------------- External Tab Filter (status) via component
const filterKey = 'status';
const ALL = '__ALL__';
const activeFilters = ref<Array<string | number>>([ALL]);
</script>

<template>
  <div class="page">
    <h1 class="page__title">Գործարքների կառավարում</h1>
    <!-- External Tabs Filter Component -->
    <ConfigurableTableFilterTabs
      v-model:activeFilters="activeFilters"
      :rows="rows"
      :filter-key="filterKey"
      mode="multi"
      all-label="Բոլորը"
      :all-value="ALL"
    />
    <ConfigurableTable
      v-model:searchQuery="search"
      v-model:selectedKeys="selected"
      v-model:selectedRows="selectedRows"
      v-model:activeFilters="activeFilters"
      :filter-key="filterKey"
      :filter-all-value="ALL"
      :filter-hide-column-when-single="true"
      table-id="transactions-table"
      :columns="columns"
      :rows="rows"
      :currency-totals="currencyTotals"
      :initial-sort="{ key: 'date', dir: 'desc' }"
      row-key="id"
      :search-keys="[
        'date',
        'number',
        'amount',
        'payerAccount',
        'accountName',
        'recipient',
        'recipientAccount',
        'status',
      ]"
      @selectionChange="({ selectedKeys }: { selectedKeys: Array<string | number> }) => (selected = selectedKeys)"
      @rowClick="handleRowClick"
    />
  </div>
</template>

<style lang="scss" scoped>
.page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;

  &__title {
    font-size: 24px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 24px;
  }

  // tabs styling moved into component
}
</style>
