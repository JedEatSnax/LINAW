// AuthRoute but reversed. Prevents authenticated users going back to login and register pages.
import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Navigate } from 'react-router-dom';

export interface IAuthRouteReversedProps {
    children: React.ReactNode;
}

const AuthRouteReversed: React.FunctionComponent<IAuthRouteReversedProps> = (props) => {
    const { children } = props;
    const auth = getAuth();
    const [loading, setLoading] = useState(true);
    const [isVerifiedAuthenticated, setIsVerifiedAuthenticated] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("already authenticated:", !!user);
            setIsVerifiedAuthenticated(!!user && user.emailVerified);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [auth]);

    if (loading) return <p></p>;

    if (isVerifiedAuthenticated) return <Navigate to="/dashboard" replace />;

    return <>{children}</>;
};

export default AuthRouteReversed;