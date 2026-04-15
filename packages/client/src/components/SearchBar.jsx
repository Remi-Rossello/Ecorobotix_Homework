import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import * as api from '../api.js';
import './SearchBar.css';

export default function SearchBar({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchLocations(query);
        setResults(data);
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (result) => {
    onSelect(result);
    setQuery('');
    setShowDropdown(false);
  };

  const formatResultLabel = (r) => {
    const parts = [r.name];
    if (r.state) parts.push(r.state);
    if (r.country) parts.push(r.country);
    return parts.join(', ');
  };

  return (
    <div className="search-wrapper" ref={wrapperRef}>
      <div className="search-input-container">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search for a location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
        />
        {query && (
          <button className="search-clear" onClick={() => { setQuery(''); setResults([]); setShowDropdown(false); }}>
            <X size={16} />
          </button>
        )}
      </div>

      {showDropdown && (
        <ul className="search-dropdown">
          {loading ? (
            <li className="search-loading">Searching...</li>
          ) : results.length === 0 ? (
            <li className="search-no-results">No results found</li>
          ) : (
            results.map((r, i) => (
              <li key={`${r.lat}-${r.lon}-${i}`}>
                <button className="search-result" onClick={() => handleSelect(r)}>
                  <span className="result-name">{r.name}</span>
                  <span className="result-detail">
                    {[r.state, r.country].filter(Boolean).join(', ')}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
