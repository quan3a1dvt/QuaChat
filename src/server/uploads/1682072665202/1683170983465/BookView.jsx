import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useNavigate } from "react-router-dom";
export const BookView = () => {
    const params = useParams();
    const [student, setPatient] = useState([]);
    const id =params.id;
    const navigate = useNavigate();
    const onSaveClick = () =>{
        console.log(student);
        if (id < 0){
            fetch(`http://localhost:8080/add`, {
                method : "POST",
                mode : "cors",
                body :  JSON.stringify(student),
                headers : {
                    'Content-Type' : 'application/json; charset =ISO-8859-1'
                }
            })
            .then(response => console.log(response))
            // .then(response => response.json())
            // .then((data) => console.log(data))
            .catch(err => console.log(err))
        }
        else{
            fetch(`http://localhost:8080/update/${id}`, {
                method : "PUT",
                mode : "cors",
                body :  JSON.stringify(student),
                headers : {
                    'Content-Type' : 'application/json; charset =ISO-8859-1'
                }
            })
            .then(response => console.log(response))
            // .then(response => response.json())
            // .then((data) => console.log(data))
            .catch(err => console.log(err))
        }
        navigate(`/student`);
        window.location.reload();
    };
    useEffect(() => {
        fetch(`http://localhost:8080/student/${id}`)
        .then(response => response.json())
        .then(data => setPatient(data))
        .catch(err => console.log(err))
    }, []);
  return (
    <div>
        <h1>{id < 0 ? "New student" : `student ${id}`}</h1>
        ID : {" "}
        <input type="number" value={student.id} onChange={(e) => setPatient({...student, id :  e.target.value})}/> <br />
        Name : {" "}
        <input type="text" value={student.name} onChange={(e) => setPatient({...student, name :  e.target.value})}/> <br />
        DOB : {" "}
        <input type="date" value={student.dob} onChange={(e) => setPatient({...student, dob :  e.target.value})}/> <br />
        major : {" "}
        <input type="text" value={student.major} onChange={(e) => setPatient({...student, major :  e.target.value})}/> <br />
        vaccinated : {" "}
        <input type="checkbox" value={student.vaccinated} onChange={(e) => setPatient({...student, vaccinated :  e.target.checked})}/> <br />
        <button onClick={onSaveClick}>Save</button>
    </div>
  )
}
