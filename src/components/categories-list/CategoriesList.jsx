import React, { useState } from "react";
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

import { IoAddOutline } from "react-icons/io5";
import { Button } from "../controls/button";
import { useRecipeBook } from "../../context";
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
  const { reorderCategories } = useRecipeBook();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleMoveUp = (index) => {
    if (index > 0) {
      reorderCategories(index, index - 1);
    }
  };

  const handleMoveDown = (index) => {
    if (index < groups.length - 1) {
      reorderCategories(index, index + 1);
    }
  };

  return (
    <>
      <div className={classes.groupList}>
        <button
          className={classes.mobileToggle}
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle categories"
          title="Categories"
        >
          <span className={classes.mobileToggleText}>Categories</span>
          {isMobileOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
        </button>
        <div
          className={`${classes.categoriesContent} ${isMobileOpen ? classes.open : ""}`}
        >
          <div className={classes.groupButtons}>
            {groups.map((group, index) => (
              <div key={group.id} className={classes.groupItem}>
                <button
                  className={`${classes.groupButton} ${
                    selectedGroup === group.id ? classes.activeGroup : ""
                  }`}
                  onClick={() => onSelectGroup(group.id)}
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
                {isAdmin && (
                  <div className={classes.actionButtons}>
                    {index > 0 && (
                      <button
                        className={classes.reorderButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveUp(index);
                        }}
                        title="Move up"
                      >
                        <FaArrowUp />
                      </button>
                    )}
                    {index < groups.length - 1 && (
                      <button
                        className={classes.reorderButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveDown(index);
                        }}
                        title="Move down"
                      >
                        <FaArrowDown />
                      </button>
                    )}
                    <button
                      className={classes.editButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditGroup(group);
                      }}
                      title="Edit category"
                    >
                      <FaRegEdit />
                    </button>
                    <button
                      className={classes.deleteButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGroup(group.id);
                      }}
                      title="Delete category"
                    >
                      <BsTrash3 />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className={classes.groupActions}>
            {isAdmin && (
              <Button
                variant="success"
                onClick={onShowAddGroup}
                title="Add New Category"
                className={classes.addCategoryBtn}
              >
                <IoAddOutline className={classes.addIcon} /> Add Category
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default CategoriesList;
