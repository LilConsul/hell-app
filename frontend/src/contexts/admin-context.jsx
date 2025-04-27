import {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";
import {apiRequest} from "@/lib/utils";

const AdminContext = createContext(null);


export function AdminProvider({children}) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [operationLoading, setOperationLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({key: "last_name", direction: "asc"});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  });
  const [selectedUsers, setSelectedUsers] = useState([]);

  const applyFilters = useCallback((userList, search, role, verification) => {
    let result = [...userList];

    if (search) {
      const searchLower = search.toLowerCase();
      const searchTerms = searchLower.split(' ').filter(term => term.length > 0);

      result = result.filter(user => {
        if (searchTerms.length > 1) {
          const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();

          if (fullName.includes(searchLower)) {
            return true;
          }
          return searchTerms.every(term => fullName.includes(term));
        }

        return (
          (user.first_name?.toLowerCase().includes(searchLower)) ||
          (user.last_name?.toLowerCase().includes(searchLower)) ||
          (user.email?.toLowerCase().includes(searchLower))
        );
      });
    }

    if (role) {
      result = result.filter(user => user.role === role);
    }

    if (verification) {
      // Use strict comparison with the string values
      if (verification === "verified") {
        result = result.filter(user => user.is_verified === true);
      } else if (verification === "unverified") {
        result = result.filter(user => user.is_verified === false);
      }
    }

    return result;
  }, []);

  const applySorting = useCallback((userList, {key, direction}) => {
    if (!key) return userList;

    return [...userList].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return direction === "asc" ? comparison : -comparison;
    });
  }, []);


  const filteredData = useMemo(() => {
    return applyFilters(users, searchTerm, roleFilter, verificationFilter);
  }, [users, searchTerm, roleFilter, verificationFilter, applyFilters]);

  useEffect(() => {
    setPagination(prev => ({...prev, totalItems: filteredData.length}));
  }, [filteredData.length]);

  const processedUsers = useMemo(() => {
    return applySorting(filteredData, sortConfig);
  }, [filteredData, sortConfig, applySorting]);

  useEffect(() => {
    setFilteredUsers(processedUsers);
  }, [processedUsers]);

  useEffect(() => {
    setPagination(prev => ({...prev, currentPage: 1}));
  }, [searchTerm, roleFilter, verificationFilter]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {data} = await apiRequest("/api/v1/admin/users");
      setUsers(data);
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch users";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers().catch(err => {
      console.error("Error in initial user fetch:", err);
    });
  }, [fetchUsers]);

  const handleSort = useCallback((key) => {
    setSortConfig(currentConfig => ({
      key,
      direction:
        currentConfig.key === key && currentConfig.direction === "asc"
          ? "desc"
          : "asc"
    }));
  }, []);

  const changeUserRole = async (userId, newRole) => {
    setOperationLoading(prev => ({...prev, [userId]: true}));

    try {
      const {data} = await apiRequest(
        `/api/v1/admin/users/change-role?user_id=${userId}&role=${newRole}`,
        {method: "POST"}
      );

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? {...user, role: newRole} : user
        )
      );

      return data;
    } finally {
      setOperationLoading(prev => ({...prev, [userId]: false}));
    }
  };

  const deleteUser = async (userId) => {
    setOperationLoading(prev => ({...prev, [userId]: true}));

    try {
      const {data} = await apiRequest(
        `/api/v1/admin/users/${userId}`,
        {method: "DELETE"}
      );

      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      setSelectedUsers(prev => prev.filter(id => id !== userId));

      return data;
    } finally {
      setOperationLoading(prev => ({...prev, [userId]: false}));
    }
  };

  // Batch delete selected users
  const batchDeleteUsers = async (useConfirmation = true) => {
    if (selectedUsers.length === 0) {
      throw new Error("No users selected for deletion");
    }

    // Only show confirmation if useConfirmation is true
    if (useConfirmation) {
      const confirmation = window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`);
      if (!confirmation) return;
    }

    setIsLoading(true);
    const failed = [];

    try {
      // In a real app, this should use a batch delete API endpoint
      // For now, we'll delete one by one
      await Promise.all(
        selectedUsers.map(async (userId) => {
          try {
            await deleteUser(userId);
          } catch (err) {
            failed.push(userId);
            console.error(`Failed to delete user ${userId}:`, err);
          }
        })
      );

      setSelectedUsers(failed); // Keep only failed deletions in selected users

      if (failed.length > 0) {
        throw new Error(`Failed to delete ${failed.length} out of ${selectedUsers.length} users`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const changeVerification = async (userId) => {
    setOperationLoading(prev => ({...prev, [userId]: true}));

    try {
      const {data} = await apiRequest(
        `/api/v1/admin/users/${userId}/verify`,
        {method: "POST"}
      );

      setUsers(users =>
        users.map(user =>
          user.id === userId ? {...user, is_verified: data.is_verified} : user
        )
      );

      return data;
    } finally {
      setOperationLoading(prev => ({...prev, [userId]: false}));
    }
  };

  // Batch change role for selected users
  const batchChangeUserRole = async (newRole, useConfirmation = true) => {
    if (selectedUsers.length === 0) {
      throw new Error("No users selected for role change");
    }

    // Only show confirmation if useConfirmation is true
    if (useConfirmation) {
      const confirmation = window.confirm(`Are you sure you want to change the role to ${newRole} for ${selectedUsers.length} users?`);
      if (!confirmation) return;
    }

    setIsLoading(true);
    const failed = [];

    try {
      // In a real app, this should use a batch update API endpoint
      // For now, we'll update one by one
      await Promise.all(
        selectedUsers.map(async (userId) => {
          try {
            await changeUserRole(userId, newRole);
          } catch (err) {
            failed.push(userId);
            console.error(`Failed to change role for user ${userId}:`, err);
          }
        })
      );

      if (failed.length > 0) {
        throw new Error(`Failed to change role for ${failed.length} out of ${selectedUsers.length} users`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Batch verify selected users
  const batchVerifyUsers = async (useConfirmation = true) => {
    if (selectedUsers.length === 0) {
      throw new Error("No users selected for verification");
    }

    // Only show confirmation if useConfirmation is true
    if (useConfirmation) {
      const confirmation = window.confirm(`Are you sure you want to verify ${selectedUsers.length} users?`);
      if (!confirmation) return;
    }

    setIsLoading(true);
    const failed = [];

    try {
      // In a real app, this should use a batch verify API endpoint
      // For now, we'll verify one by one
      await Promise.all(
        selectedUsers.map(async (userId) => {
          try {
            const user = users.find(u => u.id === userId);
            // Only attempt to verify users who aren't already verified
            if (user && !user.is_verified) {
              await changeVerification(userId);
            }
          } catch (err) {
            failed.push(userId);
            console.error(`Failed to verify user ${userId}:`, err);
          }
        })
      );

      if (failed.length > 0) {
        throw new Error(`Failed to verify ${failed.length} out of ${selectedUsers.length} users`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserSelection = useCallback((userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }, []);

  // Select/deselect all users
  const toggleSelectAll = useCallback(() => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  }, [filteredUsers, selectedUsers.length]);

  // Get user's full name
  const getUserFullName = useCallback((user) => {
    // Trim individual names before concatenation and then trim the result
    const firstName = (user.first_name || '').trim();
    const lastName = (user.last_name || '').trim();
    
    // Only add a space between names if both exist
    return firstName && lastName 
      ? `${firstName} ${lastName}` 
      : firstName || lastName || 'Unknown';
  }, []);

  const contextValue = useMemo(() => ({
    // User data
    filteredUsers,
    getUserFullName,
    totalFilteredUsers: filteredData.length,

    // Loading and error states
    isLoading,
    operationLoading,
    error,

    // Filters
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    verificationFilter,
    setVerificationFilter,

    // Sorting
    sortConfig,
    handleSort,

    // Pagination
    pagination,
    setPagination,

    // Selection for batch operations
    selectedUsers,
    toggleUserSelection,
    toggleSelectAll,

    // Operations
    fetchUsers,
    changeUserRole,
    deleteUser,
    batchDeleteUsers,
    batchChangeUserRole,
    batchVerifyUsers,
    changeVerification,
  }), [
    filteredUsers,
    filteredData.length,
    isLoading,
    operationLoading,
    error,
    searchTerm,
    roleFilter,
    verificationFilter,
    sortConfig,
    pagination,
    selectedUsers,
    toggleUserSelection,
    toggleSelectAll,
    fetchUsers,
    handleSort,
    getUserFullName
  ]);

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}


