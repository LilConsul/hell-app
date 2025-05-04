import { useState, useEffect } from "react";
import { CheckCircle, Trash2, AlertTriangle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const DeleteAccount = (props) => {
  // Get token from props or URL parameters
  const params = useParams();
  const token = props.token || params.token;
  
  const [countdown, setCountdown] = useState(5);
  const [status, setStatus] = useState("pending"); // pending, deleting, success, error
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  
  // Check token when component loads
  useEffect(() => {
    if (!token || token.trim() === '') {
      console.error("Missing or invalid token at component load:", token);
      setStatus("error");
      setErrorMessage("Missing or invalid account deletion token. Please access the link from your email again.");
    }
  }, [token]);
  
  // Function for logout
  const logout = async () => {
    try {
      console.log("Attempting to logout after account deletion...");
      
      const response = await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      console.log("Logout response:", response.status);
      
      if (!response.ok) {
        console.error("Error during logout:", response.status);
        throw new Error("Error during logout");
      }
      
      return true;
    } catch (error) {
      console.error("Exception during logout:", error);
      return false;
    }
  };
  
  // Function for account deletion
  const deleteAccount = async () => {
    setStatus("deleting");
    
    // Check token again before sending the request
    if (!token || token.trim() === '') {
      console.error("Missing or invalid token in deleteAccount:", token);
      setStatus("error");
      setErrorMessage("Missing or invalid account deletion token. Please access the link from your email again.");
      return;
    }
    
    try {
      console.log("Sending account deletion request with token:", token);
      
      // Step 1: Delete the account
      const deleteResponse = await fetch("/api/v1/users/me", {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token }),
        credentials: "include",
      });
      
      console.log("Account deletion response:", deleteResponse.status);
      
      if (!deleteResponse.ok) {
        let errorMsg = "Could not delete your account. Please try again.";
        
        try {
          const errorData = await deleteResponse.json();
          console.error("Server error details:", errorData);
          
          if (errorData.detail) {
            if (typeof errorData.detail === 'string') {
              errorMsg = errorData.detail;
            } else if (Array.isArray(errorData.detail)) {
              errorMsg = errorData.detail.map(err => err.msg || "Error").join("; ");
            } else {
              errorMsg = JSON.stringify(errorData.detail);
            }
          }
        } catch (jsonError) {
          console.error("Error parsing response:", jsonError);
        }
        
        throw new Error(errorMsg);
      }
      
      // Step 2: Logout
      const logoutSuccess = await logout();
      
      if (logoutSuccess) {
        setStatus("success");
        // Wait 2 seconds before redirecting
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        throw new Error("Account has been deleted, but there was an error during logout.");
      }
    } catch (error) {
      console.error("Error during account deletion:", error);
      setStatus("error");
      setErrorMessage(error.message || "An error occurred. Please try again.");
    }
  };
  
  useEffect(() => {
    if (countdown > 0 && status === "pending") {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && status === "pending") {
      // When countdown reaches 0 and we're still in "pending" state, delete the account
      deleteAccount();
    }
  }, [countdown, status]);

  // Display different content based on status
  const renderContent = () => {
    switch(status) {
      case "pending":
        return (
          <>
            <div className="rounded-full bg-red-100 p-5">
              <CheckCircle className="h-12 w-12 text-red-600" />
            </div>
            
            <p className="text-xl font-medium text-gray-800">
              Your account will be deleted soon.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-md p-3 w-4/5">
              <div className="text-center">
                <h3 className="text-red-700 font-medium mb-1">Ready</h3>
                <p className="text-sm text-red-600">
                  Your account will be deleted in {countdown} second{countdown !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>
          </>
        );
        
      case "deleting":
        return (
          <>
            <div className="rounded-full bg-red-100 p-5">
              <Trash2 className="h-12 w-12 text-red-600 animate-pulse" />
            </div>
            
            <p className="text-xl font-medium text-gray-800">
              Deleting your account...
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-md p-3 w-4/5">
              <div className="text-center">
                <h3 className="text-red-700 font-medium mb-1">In Progress</h3>
                <p className="text-sm text-red-600">
                  Please wait, processing your request.
                </p>
              </div>
            </div>
          </>
        );
        
      case "error":
        return (
          <>
            <div className="rounded-full bg-red-100 p-5">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
            
            <p className="text-xl font-medium text-gray-800">
              Could not delete your account.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-md p-3 w-4/5">
              <div className="text-center">
                <h3 className="text-red-700 font-medium mb-1">Error</h3>
                <p className="text-sm text-red-600">
                  {errorMessage}
                </p>
              </div>
            </div>
          </>
        );
        
      case "success":
        return (
          <>
            <div className="rounded-full bg-red-100 p-5">
              <CheckCircle className="h-12 w-12 text-red-600" />
            </div>
            
            <p className="text-xl font-medium text-gray-800">
              Your account has been successfully deleted.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-md p-3 w-4/5">
              <div className="text-center">
                <h3 className="text-red-700 font-medium mb-1">Success</h3>
                <p className="text-sm text-red-600">
                  You will be redirected to the homepage.
                </p>
              </div>
            </div>
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md relative">
        {/* Trash icon styled like in the image - red and positioned lower */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/3 z-20">
          <div className="rounded-full bg-red-600 p-4 shadow-lg">
            <Trash2 className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 pt-6 pb-6 px-4 mt-8">
          {/* Card header */}
          <div className="pt-4 pb-2 px-6 text-center">
            <h2 className="text-2xl font-semibold text-red-600">
              {status === "error" ? "Error" : 
               status === "deleting" ? "Processing" : 
               status === "success" ? "Account Deleted" : "Delete Confirmation"}
            </h2>
            <p className="text-gray-500 mt-1">
              {status === "error" ? "Could not delete your account." : 
               status === "deleting" ? "Deleting your account..." : 
               status === "success" ? "Your account has been successfully deleted." : 
               "Your account will be deleted soon."}
            </p>
          </div>
          
          {/* Card content */}
          <div className="flex flex-col items-center justify-center gap-6 py-6 px-6 text-center">
            {renderContent()}
          </div>
          
          {/* Card footer */}
          <div className="px-6 pb-2 pt-2 flex justify-center">
            {status === "error" ? (
              <div className="flex gap-3">
                <button 
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2.5 rounded-md font-medium transition-colors"
                  onClick={() => {
                    setStatus("pending");
                    setCountdown(5);
                  }}
                  disabled={status === "deleting"}
                >
                  {status === "deleting" ? "Processing..." : "Retry"}
                </button>
                <button 
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-md font-medium transition-colors"
                  onClick={() => navigate("/")}
                  disabled={status === "deleting"}
                >
                  Go to Homepage
                </button>
              </div>
            ) : status === "pending" ? (
              <button 
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-md font-medium transition-colors"
                onClick={() => navigate("/")}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;