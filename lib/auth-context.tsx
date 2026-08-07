'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '@/lib/types';
import { repo } from '@/lib/repository';

interface AuthContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: Role) => void;
  allUsers: User[];
}

const defaultUser: User = repo.getUsers()[0]; // Mặc định BS.CKII Nguyễn Văn An (RESEARCHER)

const AuthContext = createContext<AuthContextType>({
  currentUser: defaultUser,
  setCurrentUser: () => {},
  switchRole: () => {},
  allUsers: [],
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(defaultUser);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const users = repo.getUsers();
    setAllUsers(users);
    
    // Load từ localStorage nếu có
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('crms_user_id') : null;
    if (savedUserId) {
      const found = users.find((u) => u.id === savedUserId);
      if (found) setCurrentUser(found);
    }
  }, []);

  const handleSetCurrentUser = (user: User) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('crms_user_id', user.id);
    }
  };

  const switchRole = (role: Role) => {
    const userWithRole = allUsers.find((u) => u.role === role);
    if (userWithRole) {
      handleSetCurrentUser(userWithRole);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        switchRole,
        allUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
