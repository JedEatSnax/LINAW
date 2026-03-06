import axios from "axios";
import { useState } from "react";


export function ApiTest() {
    
    const [data, setData] = useState();
    const uriWithProxy = "http://localhost:3000/api/v1"

    function getDataFromServer() {
        axios
            .get(uriWithProxy)
            .then((res) => setData(res.data))
            .catch((err) => {
                console.error(err);
            });
    }

    return(
        <div className="flex flex-col justify-center items-center bg-slate-800">
            <button className="text-white p-4 bg-amber-500 hover:bg-amber-800" onClick={getDataFromServer} > Access Data from Server </button>
            <p className="text-white"> data: {data}</p>
        </div>
    );
}

export default ApiTest