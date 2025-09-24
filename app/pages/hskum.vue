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
    formatter: (v: number) => Intl.NumberFormat('hy-AM').format(v),
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
    amount: 8120000,
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
    amount: 4325,
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
    amount: 150000,
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
    amount: 25000,
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
    amount: 5000,
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
];

function handleRowClick({ row, key }: { row: any; key: string | number }) {
  console.log('Row clicked:', { row, key });
}
</script>

<template>
  <div class="page">
    <h1 class="page__title">Գործարքների կառավարում</h1>

    <ConfigurableTable
      table-id="transactions-table"
      :columns="columns"
      :rows="rows"
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
      @selectionChange="({ selectedKeys }) => console.log('Selected:', selectedKeys)"
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
}
</style>
