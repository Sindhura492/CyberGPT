import { Navigate } from "react-router-dom";
import useStore from "../../store/store";

interface PrivateRouteProps {
	children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
	// Replace this with your actual auth check

	const token = useStore.getState().token;

	if (!token) {
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
};

export default PrivateRoute;
