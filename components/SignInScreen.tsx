import React, { useState } from 'react';

interface SignInScreenProps {
  onSignIn: (name: string, password?: string) => void;
  onResetPassword: (name: string, newPassword: string) => boolean;
}

const SignInScreen: React.FC<SignInScreenProps> = ({ onSignIn, onResetPassword }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // State for reset form
  const [resetName, setResetName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');


  const handleSignIn = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
        alert("Please enter your name.");
        return;
    }
    
    onSignIn(trimmedName, password);
  };

  const handleResetPassword = () => {
    if (!resetName.trim()) {
      alert("Please enter your name to reset the password.");
      return;
    }
    if (newPassword.length < 4) {
      alert("New password must be at least 4 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const success = onResetPassword(resetName.trim(), newPassword);
    if (success) {
      setIsForgotPassword(false);
      setResetName('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (isForgotPassword) {
        handleResetPassword();
      } else {
        handleSignIn();
      }
    }
  }

  const renderSignInForm = () => (
    <>
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Sign In or Register</h2>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          <input
            type="password"
            placeholder="Password (required for new users)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          <button
            onClick={handleSignIn}
            className="w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105"
          >
            Sign In / Register
          </button>
        </div>
        <div className="text-center mt-4">
          <button
            onClick={() => setIsForgotPassword(true)}
            className="text-sm text-blue-600 hover:underline"
          >
            Forgot Password?
          </button>
        </div>
    </>
  );

  const renderForgotPasswordForm = () => (
    <>
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Reset Your Password</h2>
           <input
            type="text"
            placeholder="Enter your name"
            value={resetName}
            onChange={(e) => setResetName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          <button
            onClick={handleResetPassword}
            className="w-full py-3 px-4 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform transform hover:scale-105"
          >
            Reset Password
          </button>
        </div>
        <div className="text-center mt-4">
          <button
            onClick={() => setIsForgotPassword(false)}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to Sign In
          </button>
        </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg text-center">
        <div>
          <h1 className="text-4xl font-extrabold text-blue-600">Connect+</h1>
          <p className="mt-2 text-lg text-gray-500">Connection-first social</p>
        </div>
        {isForgotPassword ? renderForgotPasswordForm() : renderSignInForm()}
      </div>
      <p className="mt-8 text-sm text-gray-500">A project by founder Ajia Abdulrasaq of Kwara, Nigeria.</p>
    </div>
  );
};

export default SignInScreen;