import { useState } from 'react';

export function useTableFilters() {
  const [search, setSearchValue] = useState('');
  const [filter, setFilterValue] = useState('ALL');
  const [page, setPage] = useState(0);
  const setSearch = (value: string) => {
    setSearchValue(value);
    setPage(0);
  };
  const setFilter = (value: string) => {
    setFilterValue(value);
    setPage(0);
  };
  const reset = () => {
    setSearchValue('');
    setFilterValue('ALL');
    setPage(0);
  };
  return { search, filter, page, setSearch, setFilter, setPage, reset };
}
