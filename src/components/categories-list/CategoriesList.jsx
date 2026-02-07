import React, { useState, useEffect } from "react";
import {
  FaArrowUp,
  FaArrowDown,
  FaRegEdit,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import { HiOutlineTrash } from "react-icons/hi2";
import { BsTrash3 } from "react-icons/bs";
import { MdSettings } from "react-icons/md";
import { IoAddOutline } from "react-icons/io5";
import { Button } from "../controls/button";
import { useRecipeBook } from "../../context";
import { CategoriesManagement } from "../categories-management";
import classes from "./categories-list.module.css";

function CategoriesList({
  groups,
  selectedGroup,
  onSelectGroup,
  isAdmin,
  onShowAddGroup,
  onEditGroup,
  onDeleteGroup,
  getGroupContacts,
}) {
  const { reorderCategories, addCategory, editCategory, deleteCategory } =
    useRecipeBook();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showManagement, setShowManagement] = useState(false);

  // Prevent body scroll when mobile categories are open
  useEffect(() => {
    if (isMobileOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const handleCategorySelect = (groupId) => {
    onSelectGroup(groupId);
    setIsMobileOpen(false); // Close dropdown after selection
  };

  return (
    <>
      <div className={classes.groupList}>
        <div className={classes.mobileToggleContainer}>
          <button
            className={classes.mobileToggle}
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle categories"
            title="Categories"
          >
            <span className={classes.mobileToggleText}>Categories</span>
            {isMobileOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </button>
          {isAdmin && (
            <button
              className={classes.manageButton}
              onClick={(e) => {
                e.stopPropagation();
                setShowManagement(true);
              }}
              title="ניהול קטגוריות"
            >
              <MdSettings />
            </button>
          )}
        </div>
        <div
          className={`${classes.categoriesContent} ${isMobileOpen ? classes.open : ""}`}
        >
          {isAdmin && (
            <div className={classes.groupActions}>
              <button
                className={classes.manageButtonDesktop}
                onClick={() => setShowManagement(true)}
                title="ניהול קטגוריות"
              >
                <MdSettings /> Category Management
              </button>
            </div>
          )}
          <div className={classes.groupButtons}>
            {groups.map((group, index) => (
              <div key={group.id} className={classes.groupItem}>
                <button
                  className={`${classes.groupButton} ${
                    selectedGroup === group.id ? classes.activeGroup : ""
                  }`}
                  onClick={() => handleCategorySelect(group.id)}
                  title={group.description || group.name}
                  style={{
                    borderColor: group.color,
                    backgroundColor:
                      selectedGroup === group.id
                        ? `${group.color}22`
                        : "transparent",
                  }}
                >
                  {group.name}
                  <span className={classes.contactCount}>
                    {getGroupContacts(group.id).length}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showManagement && (
        <CategoriesManagement
          categories={groups}
          onClose={() => setShowManagement(false)}
          onAddCategory={addCategory}
          onEditCategory={editCategory}
          onDeleteCategory={deleteCategory}
          onReorderCategories={reorderCategories}
          getGroupContacts={getGroupContacts}
        />
      )}
    </>
  );
}

export default CategoriesList;
