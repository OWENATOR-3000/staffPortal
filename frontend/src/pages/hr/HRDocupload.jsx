import React, { useState, useEffect } from 'react';
import SidebarNav from '../../components/sidebarNav.jsx';
import Header from '../../components/header.jsx';
import { useSelector } from 'react-redux';

function HRDocupload() {
    const position = useSelector((state) => state.auth.position);
    const HRdetails = useSelector((state) => state.auth.data[0]);
    const [file, setFile] = useState(null);
    const [documents, setDocuments] = useState([]);
    const userPermissions = useSelector((state) => state.auth.userPermissions);

    // Fetch documents when component mounts
    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const response = await fetch(`http://localhost:8080/getdocuments/${HRdetails.id}`);
                if (response.ok) {
                    const data = await response.json();
                    console.log("Fetched documents:", data);
                    setDocuments(data); // Set fetched documents
                } else {
                    console.error("Failed to fetch documents:", response.statusText);
                }
            } catch (error) {
                console.error("Error fetching documents:", error);
            }
        };

        fetchDocuments();
    }, [HRdetails.id]);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!file) {
            alert("Please select a file to upload.");
            return;
        }

        const formData = new FormData();
        formData.append("employee_id", HRdetails.id); // Adding employee ID
        formData.append("doc", file); // Adding selected file

        // Log form data contents for debugging
        for (let pair of formData.entries()) {
            console.log(`${pair[0]}, ${pair[1]}`);
        }

        try {
            const response = await fetch("http://localhost:8080/uploaddocument", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                console.log("File uploaded successfully:", data);
                setDocuments((prevDocs) => [...prevDocs, data]); // Add new document to the list
            } else {
                console.error("Upload failed:", response.statusText);
                alert("File upload failed. Please try again.");
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("An error occurred while uploading the file.");
        }
    };

    const handleDelete = async (docId) => {
        try {
            const response = await fetch(`http://localhost:8080/deletedocument/${docId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                console.log("Document deleted successfully");
                // Refresh document list after deletion
                setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== docId));
            } else {
                console.error("Failed to delete document:", response.statusText);
                alert("Failed to delete document. Please try again.");
            }
        } catch (error) {
            console.error("Error deleting document:", error);
            alert("An error occurred while deleting the document.");
        }
    };

    return (
        <>
            <Header />
            <SidebarNav position={position} />
            <div id="hruploadsection">
                <div id="uploadedsection">
                    <h4>Your documents</h4>
                    <div id="uploadedcontent">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Date Submitted</th>
                                    <th>Type</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.length > 0 ? (
                                    documents.map((doc) => (
                                        <tr key={doc.id}>
                                            <td id="doclink">
                                                <a href={`http://localhost:8080/download/${doc.id}`} target="_blank" rel="noopener noreferrer">
                                                    {doc.file_name} {/* Display the document's file name */}
                                                </a>
                                            </td>
                                            <td><p>{new Date(doc.date).toLocaleDateString()}</p></td> {/* Format the submission date */}
                                            <td id="docmimetype"><p>{doc.mime_type}</p></td> {/* Display the MIME type */}
                                           
                                            {userPermissions.includes(23) && (
                                            <td id="uploaddeletebutton">
                                                <button onClick={() => handleDelete(doc.id)}>Delete</button>
                                            </td>
                                            )}  
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4">No documents found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div id="newuploadsection">
                    <p>Upload file</p>
                    <form onSubmit={handleSubmit}>
                        <input type="file"  accept="application/pdf" onChange={handleFileChange} />
                        <input id="docuploadbutton" type="submit" value="Upload" />
                    </form>
                </div>
            </div>
        </>
    );
}

export default HRDocupload;
