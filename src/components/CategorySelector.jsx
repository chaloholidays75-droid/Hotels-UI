import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback
} from "react";
import { FaChevronDown } from "react-icons/fa";
import "./CategorySelector.css";
import supplierApi from '../api/supplierApi';

const CategorySelector = forwardRef((
  {
    categoryId,
    subCategoryId,
    onCategorySelect,
    onSubCategorySelect,
    onNotify,
    errors = {},
    required = true,
    disabled = false,
    className = ''
  },
  ref
) => {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [subCategorySearch, setSubCategorySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState({ category: 0, subCategory: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({ category: false, subCategory: false });
  const [notice, setNotice] = useState("");
  const noticeTimeout = useRef(null);

  const categoryRef = useRef(null);
  const subCategoryRef = useRef(null);
  const categoryInputRef = useRef(null);
  const subCategoryInputRef = useRef(null);

  // Expose validation methods
  useImperativeHandle(ref, () => ({
    isValid: () => !!(selectedCategory && selectedSubCategory),
    getSelected: () => ({ category: selectedCategory, subCategory: selectedSubCategory })
  }));
  useEffect(() => {
  const initSelection = async () => {
    if (!categories.length) return;

    // Preselect category
    if (categoryId && !selectedCategory) {
      const category = categories.find(cat => cat.id === categoryId);
      if (category) {
        setSelectedCategory(category);
        setCategorySearch(category.name);

        // Preselect subcategory
        if (subCategoryId) {
          try {
            const subs = await supplierApi.getSubCategories(category.id);
            setSubCategories(subs || []);
            const sub = subs.find(s => s.id === subCategoryId);
            if (sub) {
              setSelectedSubCategory(sub);
              setSubCategorySearch(sub.name);
            }
          } catch (err) {
            console.error("Failed to fetch subcategories:", err);
          }
        }
      }
    }
  };

  initSelection();
}, [categories, categoryId, subCategoryId, selectedCategory]);

  // Click outside closes dropdown
  useEffect(() => {
    const handler = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) setShowCategoryDropdown(false);
      if (subCategoryRef.current && !subCategoryRef.current.contains(e.target)) setShowSubCategoryDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Helper for notices
  const showNotice = (msg, duration = 2000) => {
    clearTimeout(noticeTimeout.current);
    setNotice(msg);
    noticeTimeout.current = setTimeout(() => setNotice(""), duration);
  };

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await supplierApi.getCategories();
        setCategories(res || []);

        if (categoryId) {
          const category = (res || []).find(cat => cat.id === categoryId);
          if (category) handleCategorySelect(category);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        showNotice("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [categoryId]);
    const handleSubCategorySelect = useCallback(
    (subCategory) => {
      setSelectedSubCategory(subCategory);
      setSubCategorySearch(subCategory.name);
      setShowSubCategoryDropdown(false);
      setHighlightedIndex(prev => ({ ...prev, subCategory: 0 }));
      onSubCategorySelect?.(subCategory.id);
    },
    [onSubCategorySelect]
  );

  // Fetch subcategories for selected category
//   const fetchSubCategoriesForCategory = useCallback(async (categoryId) => {
//     if (!categoryId) return;
//     setLoading(true);
//     try {
//       const res = await supplierApi.getSubCategories(categoryId);
//       setSubCategories(res || []);

//       // Initial subcategory selection if subCategoryId provided
//       if (subCategoryId) {
//         const found = (res || []).find(sub => sub.id === subCategoryId);
//         if (found) handleSubCategorySelect(found);
//       }
//       console.log("Fetching subcategories for categoryId:", categoryId.id);

//     } catch (err) {
//       console.error('Error fetching subcategories:', err);
//       showNotice("Failed to load subcategories");
//       onNotify?.({ type: "error", message: "Failed to load categories" });
//     } finally {
//       setLoading(false);
//     }
//   }, [subCategoryId, handleSubCategorySelect, onNotify]);

const fetchSubCategoriesForCategory = useCallback(
  async (categoryOrId) => {
    if (!categoryOrId) return;

    // Determine the numeric ID
    const categoryId =
      typeof categoryOrId === "number" ? categoryOrId : categoryOrId.id;

    if (!categoryId) return;

    setLoading(true);
    try {
      const res = await supplierApi.getSubCategories(categoryId);
      setSubCategories(res || []);

      // Initial subcategory selection if subCategoryId provided
      if (subCategoryId) {
        const found = (res || []).find((sub) => sub.id === subCategoryId);
        if (found) handleSubCategorySelect(found);
      }

      console.log("Fetching subcategories for categoryId:", categoryId);
    } catch (err) {
      console.error("Error fetching subcategories:", err);
      showNotice("Failed to load subcategories");
      onNotify?.({ type: "error", message: "Failed to load categories" });
    } finally {
      setLoading(false);
    }
  },
  [subCategoryId, handleSubCategorySelect, onNotify]
);


  // Highlight search text
  const highlightText = (text, search) => {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, "ig");
    const parts = String(text).split(regex);
    return parts.map((p, i) =>
      regex.test(p) ? <span key={i} className="highlight">{p}</span> : <span key={i}>{p}</span>
    );
  };

  const filteredCategories = categories.filter(cat =>
    (cat.name || "").toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredSubCategories = selectedCategory
    ? (subCategories || []).filter(sub =>
        (sub.name || "").toLowerCase().includes(subCategorySearch.toLowerCase())
      )
    : [];

  const clearSubCategorySelection = useCallback(() => {
    setSelectedSubCategory(null);
    setSubCategorySearch("");
    onSubCategorySelect?.({ name: "", id: null });
  }, [onSubCategorySelect]);

  const handleCategorySelect = useCallback(
    (category) => {
      setSelectedCategory(category);
      setCategorySearch(category.name);
      setShowCategoryDropdown(false);
      setHighlightedIndex(prev => ({ ...prev, category: 0 }));
      clearSubCategorySelection();

      fetchSubCategoriesForCategory(category.id);
      onCategorySelect?.(category.id);
      setTimeout(() => subCategoryInputRef.current?.focus(), 0);
    },
    [clearSubCategorySelection, fetchSubCategoriesForCategory, onCategorySelect]
  );


  const handleManualCategory = useCallback(async () => {
    const name = categorySearch.trim();
    if (!name) return;

    const existing = categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      showNotice("Category already exists.");
      handleCategorySelect(existing);
      return;
    }

    setSaving(prev => ({ ...prev, category: true }));
    try {
      const newCategory = await supplierApi.createCategory({ name });
      setCategories(prev => [...prev, newCategory]);
      handleCategorySelect(newCategory);
      onNotify?.({ type: "success", message: `Category "${name}" added` });
    } catch (err) {
      console.error(err);
      showNotice("Failed to add category");
      onNotify?.({ type: "error", message: "Failed to add category" });
    } finally {
      setSaving(prev => ({ ...prev, category: false }));
    }
  }, [categorySearch, categories, handleCategorySelect, onNotify]);

  const handleManualSubCategory = useCallback(async () => {
    const name = subCategorySearch.trim();
    if (!name || !selectedCategory?.id) {
      showNotice("Select a category first");
      return;
    }

    const existing = (subCategories || []).find(sub => sub.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      showNotice("Subcategory already exists.");
      handleSubCategorySelect(existing);
      return;
    }

    setSaving(prev => ({ ...prev, subCategory: true }));
    try {
      const newSubCategory = await supplierApi.createSubCategory({ name, categoryId: selectedCategory.id });
      setSubCategories(prev => [...prev, newSubCategory]);
      handleSubCategorySelect(newSubCategory);
      onNotify?.({ type: "success", message: `Subcategory "${name}" added` });
    } catch (err) {
      console.error(err);
      showNotice("Failed to add subcategory");
      onNotify?.({ type: "error", message: "Failed to add subcategory" });
    } finally {
      setSaving(prev => ({ ...prev, subCategory: false }));
    }
  }, [subCategorySearch, selectedCategory, subCategories, handleSubCategorySelect, onNotify]);

  // Keyboard navigation
  const handleCategoryKeyDown = (e) => {
    if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) return;
    if (e.key === "Enter") e.preventDefault();

    if (e.key === "Escape") { setShowCategoryDropdown(false); return; }
    if (!filteredCategories.length) { if (e.key === "Enter") showNotice("No match. Click Add."); return; }

    let idx = highlightedIndex.category;
    if (e.key === "ArrowDown") idx = (idx + 1) % filteredCategories.length;
    if (e.key === "ArrowUp") idx = (idx - 1 + filteredCategories.length) % filteredCategories.length;
    if (e.key === "Enter") { handleCategorySelect(filteredCategories[idx]); return; }

    setHighlightedIndex(prev => ({ ...prev, category: idx }));
  };

  const handleSubCategoryKeyDown = (e) => {
    if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) return;
    if (e.key === "Enter") e.preventDefault();

    if (e.key === "Escape") { setShowSubCategoryDropdown(false); return; }
    if (!filteredSubCategories.length) { if (e.key === "Enter") showNotice("No match. Click Add."); return; }

    let idx = highlightedIndex.subCategory;
    if (e.key === "ArrowDown") idx = (idx + 1) % filteredSubCategories.length;
    if (e.key === "ArrowUp") idx = (idx - 1 + filteredSubCategories.length) % filteredSubCategories.length;
    if (e.key === "Enter") { handleSubCategorySelect(filteredSubCategories[idx]); return; }

    setHighlightedIndex(prev => ({ ...prev, subCategory: idx }));
  };

  return (
    <div className={`category-selector ${className}`}>
      {notice && <div className="cs-notice">{notice}</div>}

      {/* Category */}
      <div className={`form-group ${errors.category ? "error" : ""}`} ref={categoryRef}>
        <label className="form-label required">Category</label>
        <div className="cs-input-wrap">
          <input
            ref={categoryInputRef}
            type="text"
            value={categorySearch}
            onChange={(e) => {
                const value = e.target.value;
                setCategorySearch(value);
                setShowCategoryDropdown(true);
                setHighlightedIndex(prev => ({ ...prev, category: 0 }));

                // ✅ Only clear selection when field is actually empty
                if (value.trim() === "") {
                  setSelectedCategory(null);
                  setSubCategories([]);  // Clear subcategory list too
                  onCategorySelect?.(null);  // Notify parent form
                }
              }}

            onFocus={() => setShowCategoryDropdown(true)}
            onKeyDown={handleCategoryKeyDown}
            placeholder="Search category..."
            className="form-input"
            disabled={disabled}
          />
          <button type="button" className="cs-chevron" onClick={() => setShowCategoryDropdown(s => !s)} disabled={disabled}>
            <FaChevronDown />
          </button>
        </div>
        {showCategoryDropdown && (
          <ul className="cs-dropdown">
            {filteredCategories.map((cat, i) => (
              <li key={cat.id} className={highlightedIndex.category === i ? "highlighted" : ""} onMouseDown={e => { e.preventDefault(); handleCategorySelect(cat); }}>
                {highlightText(cat.name, categorySearch)}
              </li>
            ))}
            {categorySearch && <li className="cs-manual" onMouseDown={e => { e.preventDefault(); handleManualCategory(); }}>Add "{categorySearch}"</li>}
          </ul>
        )}
      </div>

      {/* Subcategory */}
      <div className={`form-group ${errors.subCategory ? "error" : ""}`} ref={subCategoryRef}>
        <label className="form-label required">Subcategory</label>
        <div className="cs-input-wrap">
          <input
            ref={subCategoryInputRef}
            disabled={!selectedCategory || disabled}
            type="text"
            value={subCategorySearch}
            onChange={(e) => { setSubCategorySearch(e.target.value); setShowSubCategoryDropdown(true); setSelectedSubCategory(null); setHighlightedIndex(prev => ({ ...prev, subCategory: 0 })); }}
            onFocus={() => selectedCategory && setShowSubCategoryDropdown(true)}
            onKeyDown={handleSubCategoryKeyDown}
            placeholder={selectedCategory ? "Search subcategory..." : "Select category first"}
            className="form-input"
          />
          <button type="button" className="cs-chevron" disabled={!selectedCategory || disabled} onClick={() => selectedCategory && setShowSubCategoryDropdown(s => !s)}>
            <FaChevronDown />
          </button>
        </div>
        {showSubCategoryDropdown && selectedCategory && (
          <ul className="cs-dropdown">
            {filteredSubCategories.map((sub, i) => (
              <li key={sub.id} className={highlightedIndex.subCategory === i ? "highlighted" : ""} onMouseDown={e => { e.preventDefault(); handleSubCategorySelect(sub); }}>
                {highlightText(sub.name, subCategorySearch)}
              </li>
            ))}
            {subCategorySearch && <li className="cs-manual" onMouseDown={e => { e.preventDefault(); handleManualSubCategory(); }}>Add "{subCategorySearch}"</li>}
          </ul>
        )}
      </div>

      {(loading || saving.category || saving.subCategory) && (
        <div className="cs-status">
          {loading && "Loading..."}
          {saving.category && "Saving category..."}
          {saving.subCategory && "Saving subcategory..."}
        </div>
      )}
    </div>
  );
});

export default CategorySelector;
