import {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";
import {apiRequest} from "@/lib/utils";
// Create the admin context
const AdminContext = createContext(null);

// Admin context provider
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

  // Apply filters to users
  const applyFilters = useCallback((userList, search, role, verification) => {
    let result = [...userList];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        user =>
          user.first_name?.toLowerCase().includes(searchLower) ||
          user.last_name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower)
      );
    }

    // Apply role filter
    if (role) {
      result = result.filter(user => user.role === role);
    }

    // Apply verification filter
    if (verification) {
      const isVerified = verification === "verified";
      result = result.filter(user => user.is_verified === isVerified);
    }

    return result;
  }, []);

  // Apply sorting to filtered users
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

  const applyPagination = useCallback((userList, {currentPage, itemsPerPage}) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return userList.slice(startIndex, startIndex + itemsPerPage);
  }, []);

  const filteredData = useMemo(() => {
    return applyFilters(users, searchTerm, roleFilter, verificationFilter);
  }, [users, searchTerm, roleFilter, verificationFilter, applyFilters]);

  useEffect(() => {
    setPagination(prev => ({...prev, totalItems: filteredData.length}));
  }, [filteredData.length]);

  const processedUsers = useMemo(() => {
    const sorted = applySorting(filteredData, sortConfig);
    return applyPagination(sorted, pagination);
  }, [filteredData, sortConfig, pagination, applySorting, applyPagination]);

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
      // Error is already set in state, this catch prevents unhandled promise rejections
      console.error("Error in initial user fetch:", err);
    });
  }, [fetchUsers]);

  // Handle sorting change
  const handleSort = useCallback((key) => {
    setSortConfig(currentConfig => ({
      key,
      direction:
        currentConfig.key === key && currentConfig.direction === "asc"
          ? "desc"
          : "asc"
    }));
  }, []);

  // Change user role with loading state for the specific user
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
    } catch (err) {
      throw err; // Let the component handle the error
    } finally {
      setOperationLoading(prev => ({...prev, [userId]: false}));
    }
  };

  // Delete user with loading state for the specific user
  const deleteUser = async (userId) => {
    setOperationLoading(prev => ({...prev, [userId]: true}));

    try {
      const {data} = await apiRequest(
        `/api/v1/admin/users/${userId}`,
        {method: "DELETE"}
      );

      // Remove user from the list
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      // Remove from selected users if present
      setSelectedUsers(prev => prev.filter(id => id !== userId));

      return data;
    } catch (err) {
      throw err; // Let the component handle the error
    } finally {
      setOperationLoading(prev => ({...prev, [userId]: false}));
    }
  };

  // Batch delete selected users
  const batchDeleteUsers = async () => {
    if (selectedUsers.length === 0) {
      throw new Error("No users selected for deletion");
    }

    const confirmation = window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`);
    if (!confirmation) return;

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
    } catch (err) {
      throw err; // Let the component handle the error
    } finally {
      setIsLoading(false);
    }
  };

  // Change user verification with loading state for the specific user
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
    } catch (err) {
      throw err; // Let the component handle the error
    } finally {
      setOperationLoading(prev => ({...prev, [userId]: false}));
    }
  };

  // Handle user selection for batch operations
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
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown';
  }, []);

  const contextValue = useMemo(() => ({
    // User data
    users,
    filteredUsers,
    allUsersCount: users.length,
    filteredUsersCount: filteredData.length,
    getUserFullName,

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
    changeVerification,
  }), [
    users,
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