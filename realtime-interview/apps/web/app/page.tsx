"use client";

import { useState } from "react";

export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [signUp, setSignUp] = useState(false);
  return (
    <div className="h-screen bg-gray-500 flex justify-center items-center">
      <div className="flex flex-col gap-3 p-3 bg-gray-300 shadow-md rounded-md shadow-black border-gray-600 border-2">
        <h1 className="text-center">{signUp ? "SignUp" : "Signin"}</h1>
        <div>
          <label>username: </label>
          <input
            className="px-1 border-[2px]"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label>password: </label>
          <input
            className="px-1 border-[2px]"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex text-sm">
          <p>{signUp ? "Already a user?" : "Dont have an account?"}</p>
          <button
            className="text-blue-600"
            onClick={() => setSignUp((prev) => !prev)}
          >
            {signUp ? "Signin" : "SignUp"}
          </button>
        </div>
      </div>
    </div>
  );
}
