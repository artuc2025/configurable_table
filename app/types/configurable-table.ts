export type Row = Record<string, any>;
export type ColumnDef = {
  key: string;
  label: string;
  visible?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  formatter?: (_value: any, _row?: Row) => string | number;
};
