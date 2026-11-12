import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { EmptyState, Pager, ResultCount } from './AdminUI';

type AdminDataTableProps<T extends { id: string }> = {
  data: T[];
  columns: ColumnDef<T>[];
  search: string;
  columnFilters: ColumnFiltersState;
  caption: string;
};

export default function AdminDataTable<T extends { id: string }>({
  data,
  columns,
  search,
  columnFilters,
  caption,
}: AdminDataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    state: { globalFilter: search.trim(), columnFilters },
    initialState: { pagination: { pageIndex: 0, pageSize: 8 } },
    globalFilterFn: 'includesString',
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  const total = table.getFilteredRowModel().rows.length;
  return (
    <>
      <header className="flex items-center justify-between gap-3 px-6 pb-3 max-sm:px-4">
        <h2 className="text-xs font-semibold text-neutral-700">{caption}</h2>
        <ResultCount total={total} allTotal={data.length} />
      </header>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[11px] whitespace-nowrap [&_small]:mt-1 [&_small]:block [&_small]:text-[9px] [&_small]:text-[#a3a3a3] [&_strong]:font-medium [&_strong]:text-[#525252] [&_tbody_tr:hover]:bg-[#fafafa] [&_td]:border-b [&_td]:border-[#f5f5f5] [&_td]:px-[23px] [&_td]:py-[19px] [&_td]:text-[#737373] max-xl:[&_td]:px-4 max-sm:[&_td]:py-3.5 [&_th]:border-y [&_th]:border-[#f5f5f5] [&_th]:bg-[#fafafa] [&_th]:px-[23px] [&_th]:py-[13px] [&_th]:text-[10px] [&_th]:font-medium [&_th]:text-[#a3a3a3] max-xl:[&_th]:px-4">
          <caption className="sr-only">{caption}</caption>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} colSpan={header.colSpan} scope="col">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
            {!total && (
              <tr>
                <td colSpan={table.getVisibleLeafColumns().length}>
                  <EmptyState />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-6 max-sm:px-4">
        <Pager
          page={table.getState().pagination.pageIndex}
          total={total}
          change={table.setPageIndex}
        />
      </div>
    </>
  );
}
