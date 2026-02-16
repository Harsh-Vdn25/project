import { ReactNode } from "react";

export default function Button(children: ReactNode){
    return <button className="bg-black p-2 font-semibold">
        {children}
    </button>
}