// Makes sure unauthenticated users cannot access pages that require authentication.
import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Navigate } from 'react-router-dom';

export interface IAuthRouteProps {
    children: React.ReactNode;
}

const AuthRoute: React.FunctionComponent<IAuthRouteProps> = (props) => {
    const { children } = props;
    const auth = getAuth();
    const [ loading, setLoading ] = useState(true);
    const [ isAuthenticated, setIsAuthenticated ] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
                setLoading(false);
                console.log('authorized');
            } else {
                console.log('unauthorized');
                setIsAuthenticated(false);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [auth]);

    if (loading) return <p></p>;

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return <>{ children }</>;

}

export default AuthRoute