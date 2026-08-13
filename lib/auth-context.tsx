'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Role, User } from '@/lib/types';
import { repo } from '@/lib/repository';

interface AuthContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;

  /**
   * Chỉ dùng cho mock/demo để chuyển sang
   * một user đại diện có role tương ứng.
   *
   * Không dùng hàm này để cấp quyền nghiệp vụ.
   */
  switchRole: (role: Role) => void;

  allUsers: User[];
}

const users = repo.getUsers();

if (users.length === 0) {
  throw new Error(
    'Mock repository phải có ít nhất một User để khởi tạo AuthContext.'
  );
}

const defaultUser = users[0];

const AuthContext = createContext<AuthContextType | null>(
  null
);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUserState] =
    useState<User>(defaultUser);

  const [allUsers, setAllUsers] =
    useState<User[]>(users);

  useEffect(() => {
    const repositoryUsers = repo.getUsers();

    if (repositoryUsers.length === 0) {
      return;
    }

    setAllUsers(repositoryUsers);

    const savedUserId = window.localStorage.getItem(
      'nckh_current_user_id'
    );

    if (!savedUserId) {
      return;
    }

    const savedUser = repositoryUsers.find(
      (user) => user.id === savedUserId
    );

    if (savedUser) {
      setCurrentUserState(savedUser);
    }
  }, []);

  const handleSetCurrentUser = (user: User) => {
    setCurrentUserState(user);

    window.localStorage.setItem(
      'nckh_current_user_id',
      user.id
    );
  };

  const switchRole = (role: Role) => {
    const userWithRole = allUsers.find(
      (user) => user.role === role
    );

    if (!userWithRole) {
      return;
    }

    handleSetCurrentUser(userWithRole);
  };

  const value = useMemo<AuthContextType>(
    () => ({
      currentUser,
      setCurrentUser: handleSetCurrentUser,
      switchRole,
      allUsers,
    }),
    [currentUser, allUsers]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth phải được sử dụng bên trong AuthProvider.'
    );
  }

  return context;
}