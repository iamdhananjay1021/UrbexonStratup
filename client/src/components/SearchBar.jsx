import { useEffect, useState, useCallback, memo } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { FaSearch, FaTimes } from "react-icons/fa";

const SearchBar = memo(({ onSearch }) => {
    const [input, setInput] = useState("");
    const [error, setError] = useState("");
    const [searchParams] = useSearchParams();
    const location = useLocation();

    /* Sync URL → input (only when search param actually changes) */
    useEffect(() => {
        const q = searchParams.get("search") || "";
        setInput(q);
        setError("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    const triggerSearch = useCallback(() => {
        if (input.trim().length < 3) {
            setError("Enter at least 3 characters");
            return;
        }
        setError("");
        onSearch(input.trim());
    }, [input, onSearch]);

    const clearSearch = useCallback(() => {
        setInput("");
        setError("");
        onSearch("");
    }, [onSearch]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            triggerSearch();
        }
    }, [triggerSearch]);

    const handleChange = useCallback((e) => {
        setInput(e.target.value);
        setError("");
    }, []);

    return (
        <div className="w-full">
            <style>{`
                @media(max-width:480px){
                    .sb-input{font-size:14px!important;padding:12px 8px!important}
                    .sb-btn{padding:0 14px!important;font-size:12px!important}
                    .sb-wrap{border-radius:10px!important}
                }
            `}</style>
            <div
                className="sb-wrap flex w-full overflow-hidden transition-all duration-200"
                style={{
                    borderRadius: 12,
                    border: "1.5px solid #e5e3e0",
                    background: "#fafaf9",
                    boxShadow: "0 1px 4px rgba(26,20,71,0.05)",
                }}
                /* can't use focus-within with inline styles, so we use a wrapper trick */
                onFocus={e => e.currentTarget.style.borderColor = "#1a1447"}
                onBlur={e => e.currentTarget.style.borderColor = "#e5e3e0"}
            >
                {/* Search icon */}
                <div className="flex items-center pl-3.5 shrink-0" style={{ color: "#9ca3af" }}>
                    <FaSearch size={13} />
                </div>

                <input
                    type="text"
                    value={input}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Search fashion, electronics, more..."
                    className="sb-input"
                    style={{
                        flex: 1,
                        padding: "10px 8px",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#1a1447",
                        fontFamily: "'DM Sans', sans-serif",
                        minWidth: 0,
                    }}
                />

                {/* Clear */}
                {input && (
                    <button
                        onClick={clearSearch}
                        aria-label="Clear search"
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            padding: "0 8px", background: "none", border: "none",
                            color: "#9ca3af", cursor: "pointer", flexShrink: 0,
                            transition: "color 0.15s",
                        }}
                        onMouseOver={e => e.currentTarget.style.color = "#1a1447"}
                        onMouseOut={e => e.currentTarget.style.color = "#9ca3af"}
                    >
                        <FaTimes size={11} />
                    </button>
                )}

                {/* Search button */}
                <button
                    onClick={triggerSearch}
                    className="sb-btn"
                    style={{
                        flexShrink: 0,
                        padding: "0 18px",
                        background: "#1a1447",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: "'DM Sans', sans-serif",
                        transition: "background 0.18s",
                        letterSpacing: "0.02em",
                    }}
                    onMouseOver={e => e.currentTarget.style.background = "#0f0c29"}
                    onMouseOut={e => e.currentTarget.style.background = "#1a1447"}
                    onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
                    onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                >
                    Search
                </button>
            </div>

            {error && (
                <p style={{ color: "#dc2626", fontSize: 11, marginTop: 5, paddingLeft: 4, fontFamily: "'DM Sans', sans-serif" }}>
                    {error}
                </p>
            )}
        </div>
    );
});

SearchBar.displayName = "SearchBar";
export default SearchBar;