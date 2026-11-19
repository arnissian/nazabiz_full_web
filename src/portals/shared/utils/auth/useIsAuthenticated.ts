// utils/auth.ts

import { useContext } from "react";
import {AppContext} from "../../context/AppContext";

export function useIsAuthenticated(): boolean {
  const { auth, access_token } = useContext(AppContext) || {};
  
  return Boolean(auth?.token || access_token);
}
