const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const app = express();
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// CORS configuration
const corsOptions = {
    origin: ["http://192.168.8.114:5173", "http://192.168.8.114:5174", "http://localhost:5173", "http://192.168.178.40:5173"], // Add the origin for the frontend
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true // Allow credentials if needed
};

app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options("*", cors(corsOptions));

// Body parser setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    //     password: "Shagina03!!",
    password: "",
    database: "sp_db"
});

// Check database connection
db.connect(err => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database.');
    const PORT = process.env.PORT || 8080;
    server.listen(PORT, () => {
        console.log(`Server listening on port http://localhost:${PORT}`);
    });
});

// The Messaging Platform code

wss.on('connection', (ws) => {
    console.log('New WebSocket connection established'); // Log when a new connection is made

    // Listen for incoming messages from the WebSocket
    ws.on('message', async (message) => {
        console.log('Received WebSocket message:', message); // Log the received message
        try {
            const data = JSON.parse(message); // Parse the message from JSON format

            // If the message is a chat message
            if (data.type === 'chatMessage') {
                const { chat_id, sender_id, content, client_id } = data; // Destructure message data

                // Insert the message into the database, including client_id if present
                db.query(
                    'INSERT INTO messages (chat_id, sender_id, content, client_id) VALUES (?, ?, ?, ?)',
                    [chat_id, sender_id, content, client_id || null],
                    (err, result) => {
                        if (err) {
                            console.error('Error inserting message into database:', err);
                            return;
                        }
                        console.log('Message saved to database:', result);

                        db.query(
                            'SELECT user_id FROM chat_participants WHERE chat_id = ? AND user_id != ?',
                            [chat_id, sender_id],
                            (err, participants) => {
                                if (err) {
                                    console.error('Error fetching participants:', err);
                                    return;
                                }
                                const recipient_id = participants[0].user_id; // Get the recipient's user ID

                                db.query(`
                            INSERT INTO unread_messages (chat_id, user_id, count)
                            VALUES (?, ?, 1)
                            ON DUPLICATE KEY UPDATE count = count + 1
                        `, [chat_id, recipient_id], (err) => {
                                    if (err) {
                                        console.error('Error updating unread messages:', err);
                                        return;
                                    }

                                    db.query(`
                                SELECT count FROM unread_messages
                                WHERE chat_id = ? AND user_id = ?
                            `, [chat_id, recipient_id], (err, unreadCount) => {
                                        if (err) {
                                            console.error('Error fetching unread messages:', err);
                                            return;
                                        }

                                        wss.clients.forEach((client) => {
                                            if (client.readyState === WebSocket.OPEN) {
                                                client.send(JSON.stringify({
                                                    type: 'newMessage',
                                                    message: {
                                                        id: result.insertId,
                                                        chat_id,
                                                        sender_id,
                                                        content,
                                                        timestamp: new Date().toISOString(),
                                                        client_id // Echo back the client_id
                                                    },
                                                    unreadCount: {
                                                        chat_id,
                                                        user_id: recipient_id,
                                                        count: unreadCount[0].count
                                                    }
                                                }));
                                            }
                                        })
                                    })
                                });
                                ws.on('close', () => {
                                    console.log('WebSocket connection closed'); // Log when the connection is closed
                                });
                            }
                        )
                    }
                )
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error); // Log errors
        }
    });

    // Handle WebSocket connection closure
    ws.on('close', () => {
        console.log('WebSocket connection closed'); // Log when the connection is closed
    });
});

// API endpoint to get a list of users
app.get('/api/staff_members', (req, res) => {
    db.query('SELECT id, Name AS name, email FROM staff_members', (err, rows) => {
        if (err) {
            console.error('Error fetching staff members:', err);
            return res.status(500).json({ error: 'An error occurred while fetching staff members' });
        }
        res.json(rows);
    });
});


app.get('/api/staff_members/:id', (req, res) => {
    db.query('SELECT id, Name AS name, email FROM staff_members WHERE id = ?', [req.params.id], (err, rows) => {
        if (err) {
            console.error('Error fetching staff member:', err);
            return res.status(500).json({ error: 'An error occurred while fetching the staff member' });
        }
        res.json(rows[0]);
    });
});


app.get('/api/chats/user/:userId', (req, res) => {
    db.query(
        `SELECT c.id, c.created_at,
        (
          SELECT MAX(m.timestamp)
          FROM messages m
          WHERE m.chat_id = c.id
        ) as last_message_time,
        GROUP_CONCAT(cp.user_id) as participants
         FROM chats c 
         JOIN chat_participants cp ON c.id = cp.chat_id 
         WHERE c.id IN (SELECT chat_id FROM chat_participants WHERE user_id = ?)
         GROUP BY c.id`,
        [req.params.userId],
        (err, rows) => {
            if (err) {
                console.error('Error fetching chats:', err);
                return res.status(500).json({ error: 'An error occurred while fetching chats' });
            }
            console.log('Fetched chats for user:', req.params.userId, 'Count:', rows.length);
            res.json(rows.map(row => ({
                ...row,
                participants: row.participants.split(',').map(Number)
            })));
        }
    );
});

app.post('/api/chats', (req, res) => {
    db.query('INSERT INTO chats () VALUES ()', (err, result) => {
        if (err) {
            console.error('Error creating chat:', err);
            return res.status(500).json({ error: 'An error occurred while creating the chat' });
        }
        const chatId = result.insertId;

        // Insert participants into chat_participants table
        const participants = req.body.participants.map(userId => [chatId, userId]);
        db.query('INSERT INTO chat_participants (chat_id, user_id) VALUES ?', [participants], (err) => {
            if (err) {
                console.error('Error inserting chat participants:', err);
                return res.status(500).json({ error: 'An error occurred while adding participants' });
            }
            console.log('Created new chat:', chatId, 'Participants:', req.body.participants);
            res.status(201).json({ id: chatId, message: 'Chat created successfully' });
        });
    });
});

// API endpoint to get messages for a specific chat
app.get('/api/messages/chat/:chatId', (req, res) => {
    db.query(
        `SELECT m.id, m.content, m.timestamp, m.sender_id, sm.Name AS sender_name 
         FROM messages m 
         JOIN staff_members sm ON m.sender_id = sm.id 
         WHERE m.chat_id = ? 
         ORDER BY m.timestamp ASC`,
        [req.params.chatId],
        (err, rows) => {
            if (err) {
                console.error('Error fetching messages:', err);
                return res.status(500).json({ error: 'An error occurred while fetching messages' });
            }
            console.log('Fetched messages for chat:', req.params.chatId, 'Count:', rows.length);
            res.json(rows);
        }
    );
});

// API endpoint to send a new message
app.post('/api/messages', (req, res) => {
    const { chat_id, sender_id, content } = req.body;
    const timestampThreshold = 5000; // 5 seconds in milliseconds

    db.query(
        `SELECT COUNT(*) AS count 
         FROM messages 
         WHERE chat_id = ? AND sender_id = ? AND content = ? 
         AND timestamp >= NOW() - INTERVAL ? SECOND`,
        [chat_id, sender_id, content, timestampThreshold / 1000],
        (err, results) => {
            if (err) {
                console.error('Error checking for duplicate message:', err);
                return res.status(500).json({ error: 'Error checking for duplicate message' });
            }

            if (results[0].count > 0) {
                console.log('Duplicate message detected within threshold; skipping insert.');
                return res.status(409).json({ message: 'Duplicate message detected' });
            }

            db.query(
                'INSERT INTO messages (chat_id, sender_id, content, timestamp) VALUES (?, ?, ?, NOW())',
                [chat_id, sender_id, content],
                (err, result) => {
                    if (err) {
                        console.error('Error sending message:', err);
                        return res.status(500).json({ error: 'An error occurred while sending the message' });
                    }
                    console.log('Message saved with ID:', result.insertId);
                    res.status(201).json({ id: result.insertId, message: 'Message sent successfully' });
                }
            );
        }
    );
});

// API endpoint to get unread message counts for a specific user
app.get('/api/unread/:staffId', (req, res) => {
    db.query(`SELECT chat_id, count FROM unread_messages WHERE user_id = ?`, [req.params.staffId], (err, rows) => {
        if (err) {
            console.error('Error fetching unread counts:', err);
            return res.status(500).json({ error: 'An error occurred while fetching unread counts' });
        }
        res.json(rows);
    });
});

// API endpoint to mark messages as read
app.post('/api/markAsRead', (req, res) => {
    const { userId, chatId } = req.body;
    db.query(`DELETE FROM unread_messages WHERE user_id = ? AND chat_id = ?`, [userId, chatId], (err) => {
        if (err) {
            console.error('Error marking messages as read:', err);
            return res.status(500).json({ error: 'An error occurred while marking messages as read' });
        }
        res.json({ message: 'Messages marked as read' });
    });
});

// initDatabase().then(() => {
//     const PORT = process.env.PORT || 8080; // Use the environment variable or default to port 3000
//     server.listen(PORT, '0.0.0.0', () => {
//       console.log(`Server running on http://0.0.0.0:${PORT}`); // Log the server startup
//     });
// });

const multer = require('multer');

// Set up multer for file uploads
const storage = multer.memoryStorage(); // Use memory storage to handle file uploads in memory
const upload = multer({ storage: storage });


// Insert staff member
app.post("/api/data", upload.single('profileImg'), (req, res) => {
    const { Name, Surname, ID_Number, DOB, Gender, Nationality, Supervisor, Home_Language, Other_Languages, Position, password } = req.body;
    const profileImg = req.file; // The uploaded file (from 'profileImg')

    if (!profileImg) {
        return res.status(400).json({ message: "Profile picture is required" });
    }

    // Insert the staff member details into the database
    db.query(
        "INSERT INTO staff_members (Name, Surname, ID_Number, DOB, Gender, Nationality, Supervisor, Home_Language, Other_Languages, Position, profileImg, Password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            Name,
            Surname,
            ID_Number,
            DOB,
            Gender,
            Nationality,
            Supervisor,
            Home_Language,
            Other_Languages,
            Position,
            profileImg.buffer, // Use the buffer for insertion
            password
        ],
        (err) => {
            if (err) {
                console.error('Error inserting data:', err);
                return res.status(500).json({ message: "Error inserting data", error: err });
            }
            res.status(201).json({ message: "Staff member added successfully" });
        }
    );
});


// post methods
app.post("/api/login", (req, res) => {
    const { firstname, password } = req.body;
    console.log("Recieved request:", req.body);
    db.query(
        "SELECT * FROM staff_members WHERE Name = ? AND Password = ? AND Position != 'Super Admin'",
        [firstname, password],
        (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ message: "Error checking login", error: err });
            }

            if (results.length > 0) {
                const token = "mock-token";
                // Convert profileImg buffer to base64 string if it exists
                let userObj = { ...results[0] };
                if (userObj.profileImg) {
                    // Handle both Buffer and {type: 'Buffer', data: [...]} cases
                    let buf = Buffer.isBuffer(userObj.profileImg)
                        ? userObj.profileImg
                        : Buffer.from(userObj.profileImg.data || []);
                    userObj.profileImg = buf.length > 0 ? buf.toString('base64') : null;
                } else {
                    userObj.profileImg = null;
                }
                res.json({
                    message: "Login successful",
                    user: userObj,
                    token
                });
            } else {
                res.status(401).json({ message: "Invalid username or password" });
            }
        }
    );
});

// Get users
// app.get('/users', (req, res) => {
//     const sql = "SELECT * FROM staff_members";
//     db.query(sql, (err, data) => {
//         if (err) {
//             console.error('Error fetching users:', err);
//             return res.status(500).json({ message: "Error fetching users", error: err });
//         }
//         return res.json(data);
//     });
// });

app.get('/getStaffDetails/:id', (req, res) => {
    const staffId = req.params.id;

    //Query database to get staff details for this ID
    db.query('SELECT * FROM staff_members WHERE Id = ?', [staffId], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error retrieving staff details' });
        }
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ error: 'Staff member not found' });
        }
    });
});

//   //Retrieving profile image
app.get('/staff/:id/profile-image', (req, res) => {
    const staffId = req.params.id;

    db.query('SELECT profileImg FROM staff_members WHERE Id = ?', [staffId], (err, result) => {
        if (err) {
            return res.status(500).send('Error fetching image');
        }

        if (result.length > 0) {
            const image = result[0].profileImg;


            res.set('Content-Type', 'image/jpg');

            // Send the image data as the response
            res.send(image);
        } else {
            res.status(404).send('Image not found');
        }
    });
});


// //Change Staff Info
app.get('/api/staff', (req, res) => {
    const query = 'SELECT Name, Surname, Position FROM staff_members';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error retrieving staff data' });
        }
        console.log(results);
        res.json(results);
    });
});

// // Update user
app.patch('/users/:id', (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    const sql = "UPDATE staff_members SET Name = ?, Surname = ?, DOB = ?, Nationality = ?, Home_Language = ?, Other_Languages = ?, Position = ? WHERE ID_Number = ?";
    const values = [
        updatedData.firstname,
        updatedData.lastname,
        updatedData.dateofbirth,
        updatedData.nationality,
        updatedData.languages,
        updatedData.languages,
        updatedData.position,
        id
    ];
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error updating employee:', err);
            return res.status(500).json({ message: "Error updating employee", error: err });
        }
    });
});

app.post("/api/leave", (req, res) => {
    const { employeeName, position, date, supervisorName, startDate, endDate, totalDays, reason, resumingWorkDay, emergencyName, emergencyAddress, emergencyPhone } = req.body;

    db.query(
        "INSERT INTO leave_requests (employee_name, position, date, supervisor_name, start_date, end_date, total_days, reason, resuming_work_days, emergency_name, emergency_address, emergency_phone_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [employeeName, position, date, supervisorName, startDate, endDate, totalDays, reason, resumingWorkDay, emergencyName, emergencyAddress, emergencyPhone],
        (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Database insertion failed" }); // Handle error and send response
            }

            // Create newLeaveRequest object inside the callback
            const newLeaveRequest = {
                EmployeeName: employeeName,
                position: position,
                Date: date,
                SuperVisorName: supervisorName,
                StartDate: startDate,
                EndDate: endDate,
                TotalDays: totalDays,
                reason: reason,
                ResumingWorkDay: resumingWorkDay,
                EmergencyName: emergencyName,
                EmergencyAddress: emergencyAddress,
                EmergencyPhone: emergencyPhone,
                ID_Number: result.insertId // Include the generated ID from the database
            };

            // Send response only once
            return res.json(newLeaveRequest);
        }
    );
});


app.get('/employeeovertime/:name', (req, res) => {
    const employeeName = req.params.name;
    const sql = "SELECT * FROM overtime_requests WHERE employee_name = ? ";
    db.query(sql, [employeeName], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching overtime requests' });
        }
        res.json(results);
    });
});


app.post("/api/overtime", (req, res) => {
    const { employeeName, position, date, start_time, end_time, duration, reason } = req.body;

    // Log the incoming request body
    console.log("Received data:", req.body);

    // Check for required fields
    if (!employeeName || !position || !date || !start_time || !end_time || !duration || !reason) {
        return res.status(400).json({ message: "All fields are required." });
    }

    db.query(
        "INSERT INTO overtime_requests (employee_name, position, date, start_time, end_time, duration, reason, status, reqstatus) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', 'unseen')",
        [employeeName, position, date, start_time, end_time, duration, reason],
        (err) => {
            if (err) {
                console.error("Database insertion error:", err);
                return res.status(500).json({ message: "Database error" });
            }
            const newOvertimeRequest = {
                employeeName,
                position,
                date,
                start_time,
                end_time,
                duration,
                reason
            };
            res.json(newOvertimeRequest);
        }
    );
});


app.post("/api/clock", (req, res) => {
    console.log(req.body)
    const { action, time, date, userId } = req.body;

    db.query(
        "INSERT INTO clock_log (action, time, date, userId) VALUES (?,?,?,?)",
        [action, time, date, userId],
        (err) => {
            if (err) throw err;
            const newClockLog = {
                action,
                time,
                date,
                userId,
            };
            res.json(newClockLog);
        }
    );
});

app.get("/api/clock/:userId", (req, res) => {
    const { userId } = req.params;

    db.query(
        "SELECT * FROM clock_log WHERE user_id = ? ORDER BY date DESC, time DESC",
        [userId],
        (err, results) => {
            if (err) return res.status(500).json({ message: "Error fetching clock logs", error: err });
            res.json(results)
        }
    );
});

app.post("/api/printing", (req, res) => {
    const { employee_id, name, type, email, date } = req.body;

    // Corrected SQL query with backticks for column names
    db.query(
        "INSERT INTO printing_requests (`employee_id`, `name`, `type`, `email`, `date`) VALUES (?, ?, ?, ?, ?)",
        [employee_id, name, type, email, date],
        (err) => {
            if (err) throw err;
            const newPrintingRequest = {
                employee_id,
                name,
                type,
                email,
                date
            };
            res.json(newPrintingRequest);
        }
    );
});

app.get("/api/getprinting", (req, res) => {
    db.query(
        "SELECT * FROM printing_requests ORDER BY date DESC",
        (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                return res.status(500).json({ message: "Error fetching report requests", error: err });
            }
            console.log("Fetched results:", results);
            res.json(results);
        }
    );
});

app.get("/api/getprinting/:id", (req, res) => {
    const { id } = req.params; // Extract id from route parameter
    const sql = "SELECT * FROM printing_requests WHERE employee_id = ? ORDER BY date DESC"; // Add the condition for employee_id

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).json({ message: "Error fetching report requests", error: err });
        }
        console.log("Fetched results:", results);
        res.json(results);
    });
});


app.patch('/api/setprinting/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const sql = "UPDATE printing_requests SET status = ? WHERE id = ?"; // Change table name here
    db.query(sql, [status, id], (err, result) => {
        if (err) {
            console.error('Error updating printing request:', err);
            return res.status(500).json({ message: "Error updating printing request", error: err });
        }
        res.json({ id, status }); // Return updated printing request info
    });
});



// get requests
app.get('/users', (req, res) => {
    const sql = "SELECT * FROM staff_members where Position != 'Super Admin'";
    db.query(sql, (err, data) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ message: "Error fetching users", error: err });
        }

        // Convert BLOB to base64
        const usersWithBase64Images = data.map(user => {
            if (user.profilepicture) {
                const base64Image = Buffer.from(user.profilepicture).toString('base64');
                user.profilepicture = `data:image/jpeg;base64,${base64Image}`; // Adjust MIME type based on the actual image type
            } else {
                user.profilepicture = null; // Handle case where there's no profile picture
            }
            return user;
        });

        return res.json(usersWithBase64Images);
    });
});
// app.get('/getStaffDetails/:id', (req, res) => {
//     const staffId = req.params.id; 

//     //Query database to get staff details for this ID
//     db.query('SELECT * FROM staff_members WHERE Id = ?', [staffId], (error, results) => {
//       if (error) {
//         return res.status(500).json({ error: 'Error retrieving staff details' });
//       }
//       if (results.length > 0) {
//         res.json(results[0]);
//       } else {
//         res.status(404).json({ error: 'Staff member not found' });
//       }
//     });
//   });

//Retrieving profile image
// API to get all users images on HR side
app.get('/staff/:id/profile-image', (req, res) => {
    const staffId = req.params.id;

    db.query('SELECT profileImg FROM staff_members WHERE Id = ?', [staffId], (err, result) => {
        if (err) {
            return res.status(500).send('Error fetching image');
        }

        if (result.length > 0) {
            const image = result[0].profileImg;

            res.set('Content-Type', 'image/jpg');

            // Send the image data as the response
            res.send(image);
        } else {
            res.status(404).send('Image not found');
        }
    });
});

//Change Staff Info
app.get('/api/staff', (req, res) => {
    const query = 'SELECT Name, Surname, Position FROM staff_members';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error retrieving staff data' });
        }
        console.log(results);
        res.json(results);
    });
});

// Update user
app.patch('/updateuser/:id', (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    const sql = "UPDATE staff_members SET Name = ?, Surname = ?, ID_Number = ?, DOB = ?, Gender = ?, Nationality = ?, Supervisor = ?, Home_Language = ?, Other_Languages = ?, Position = ? WHERE id = ?";
    const values = [
        updatedData.Name,
        updatedData.Surname,
        updatedData.ID_Number,
        updatedData.DOB,
        updatedData.Gender,
        //         updatedData.nationality,
        //         updatedData.languages, 
        //         updatedData.languages, 
        //         updatedData.position
        updatedData.Nationality,
        updatedData.Supervisor,
        updatedData.Home_Language,
        updatedData.Other_Languages,
        updatedData.Position,
        id
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error updating employee:', err);
            return res.status(500).json({ message: "Error updating employee", error: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.json({ id: id, ...updatedData });
    });
});


// Delete user
app.delete('/deleteuser/:id', (req, res) => {
    const { id } = req.params;

    const checkSql = "SELECT * FROM staff_members WHERE id = ?";
    db.query(checkSql, [id], (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Error checking employee existence:', checkErr);
            return res.status(500).json({ message: "Error checking employee", error: checkErr });
        }
        if (checkResult.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const sql = "DELETE FROM staff_members WHERE id = ?";
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error('Error deleting employee:', err);
                return res.status(500).json({ message: "Error deleting employee", error: err });
            }
            console.log(`Deleted employee with ID: ${id}, affected rows: ${result.affectedRows}`);
            res.sendStatus(204);
        });
    });
});


// // Leave request operations


// // Update leave request
// app.patch('/leaverequests/:id', (req, res) => {
//     const { id } = req.params;
//     const { status, msgstatus } = req.body;

//     const sql = "UPDATE leaverequests SET status = ?, msgstatus = ? WHERE id = ?";
//     db.query(sql, [status, msgstatus, id], (err, result) => {
//         if (err) {
//             console.error('Error updating leave request:', err);
//             return res.status(500).json({ message: "Error updating leave request", error: err });
//         }
//         res.json({ id, status, msgstatus }); // Return updated leave request info
//     });
// });

// Overtime request section
app.get('/overtimerequest', (req, res) => {
    const sql = "SELECT * FROM overtime_requests ORDER BY id DESC";
    db.query(sql, (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    });
});

app.get('/employeeovertime/:Name', (req, res) => {
    const { Name } = req.params;
    const sql = "SELECT * FROM overtime_requests WHERE employee_name = ? ORDER BY date DESC";

    db.query(sql, [Name], (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (data.length === 0) {
            return res.status(404).json({ message: "No overtime records found for this user" });
        }
        return res.json(data); // Return all matching records
    });
});

// Update the status of an overtime request
app.patch('/overtimerequest/:id', (req, res) => {
    const requestId = req.params.id;
    const { status, reqstatus } = req.body;

    console.log(`Updating request ID: ${requestId}, status: ${status}, reqstatus: ${reqstatus}`);

    const sql = "UPDATE overtime_requests SET status = ?, reqstatus = ? WHERE id = ?";
    db.query(sql, [status, reqstatus, requestId], (err, result) => {
        if (err) {
            console.error('Error updating status:', err);
            return res.status(500).json(err);
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }
        return res.json({ message: 'Status updated successfully', result });
    });
});

///payroll section
app.get('/hrpayroll', (req, res) => {
    const sql = "SELECT * FROM pay_roll ORDER BY id DESC";
    db.query(sql, (err, data) => {
        if (err) {
            console.error('Error fetching pay roll requests:', err);
            return res.status(500).json({ message: "Error fetching pay roll requests", error: err });
        }
        return res.json(data);
    });
});

app.get('/hrpayroll/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM pay_roll WHERE employee_id = ?";

    db.query(sql, [id], (err, data) => {
        if (err) {
            console.error('Error fetching payroll:', err);
            return res.status(500).json({ message: "Error fetching payroll", error: err });
        }

        console.log('Fetched payroll data:', data); // Log to verify data structure
        return res.json(data);
    });
});


app.post("/api/setpayroll", (req, res) => {
    console.log(req.body);
    const { employee_id, Name, Surname, Position, regular_rate, overtime_rate, gross_pay } = req.body;

    // Validate required fields (you may want to add more validation)
    if (!employee_id || !Name || !Surname || !Position || regular_rate === undefined || overtime_rate === undefined || gross_pay === undefined) {
        return res.status(400).json({ message: "All fields are required." });
    }

    // Updated query: removed single quotes from column names
    db.query(
        "INSERT INTO pay_roll (employee_id, Name, Surname, Position, regular_rate, overtime_rate, gross_pay) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [employee_id, Name, Surname, Position, regular_rate, overtime_rate, gross_pay], // Use an array for parameters
        (err) => {
            if (err) {
                console.error(err); // Log the error for debugging
                return res.status(500).json({ message: "Error inserting payroll data." });
            }
            const newPayrollLog = {
                employee_id, Name, Surname, Position, regular_rate, overtime_rate, gross_pay
            };
            res.status(201).json(newPayrollLog); // Respond with the created object and a 201 status
        }
    );
});

app.patch('/api/updatepayroll/:id', (req, res) => {
    const { id } = req.params;
    const { employee_id, Name, Surname, Position, regular_rate, overtime_rate, gross_pay } = req.body;

    // Create an array for the fields to be updated
    const updates = [];
    const values = [];

    // Add fields to the updates array if they are provided
    if (employee_id !== undefined) {
        updates.push('employee_id = ?');
        values.push(employee_id);
    }
    if (Name !== undefined) {
        updates.push('Name = ?');
        values.push(Name);
    }
    if (Surname !== undefined) {
        updates.push('Surname = ?');
        values.push(Surname);
    }
    if (Position !== undefined) {
        updates.push('Position = ?');
        values.push(Position);
    }
    if (regular_rate !== undefined) {
        updates.push('regular_rate = ?');
        values.push(regular_rate);
    }
    if (overtime_rate !== undefined) {
        updates.push('overtime_rate = ?');
        values.push(overtime_rate);
    }
    if (gross_pay !== undefined) {
        updates.push('gross_pay = ?');
        values.push(gross_pay);
    }

    // Check if there are updates to be made
    if (updates.length === 0) {
        return res.status(400).json({ message: "No fields provided for update." });
    }

    // Construct the SQL query
    const sql = `UPDATE pay_roll SET ${updates.join(', ')} WHERE id = ?`;
    values.push(id); // Add the id to the end of the values array

    // Execute the query
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error updating pay_roll:', err);
            return res.status(500).json({ message: "Error updating payroll", error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Payroll not found." });
        }
        res.json({ message: "Payroll updated successfully", id }); // Return a success message and the updated id
    });
});



// Leave request operations

app.get('/leaverequests', (req, res) => {
    const sql = "SELECT * FROM leave_requests ORDER BY id DESC";
    db.query(sql, (err, data) => {
        if (err) {
            console.error('Error fetching leave requests:', err);
            return res.status(500).json({ message: "Error fetching leave requests", error: err });
        }
        return res.json(data);
    });
});

app.get('/employeeleave/:name', (req, res) => {
    const { name } = req.params;
    // Query the database for records
    db.query('SELECT * FROM leave_requests WHERE employee_name = ? ORDER BY id DESC', [name], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database query error' });
        }

        if (results.length === 0) {
            // Send 200 status with an empty array if no records are found
            return res.status(200).json([]);
        }

        res.status(200).json(results); // Return found records
    });
});


// Update leave request
app.patch('/leaverequests/:id', (req, res) => {
    const { id } = req.params;
    const { status, reqstatus } = req.body;

    const sql = "UPDATE leave_requests SET status = ?, reqstatus = ? WHERE id = ?";
    db.query(sql, [status, reqstatus, id], (err, result) => {
        if (err) {
            console.error('Error updating leave request:', err);
            return res.status(500).json({ message: "Error updating leave request", error: err });
        }
        res.json({ id, status, reqstatus }); // Return updated leave request info
    });
});

// Overtime request section
app.get('/overtimerequest', (req, res) => {
    const sql = "SELECT * FROM overtime_requests ORDER BY id DESC";
    db.query(sql, (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    });
});

// Update the status of an overtime request
app.patch('/overtimerequest/:id', (req, res) => {
    const requestId = req.params.id;
    const { status, reqstatus } = req.body;

    console.log(`Updating request ID: ${requestId}, status: ${status}, reqstatus: ${reqstatus}`);

    const sql = "UPDATE overtime_requests SET status = ?, reqstatus = ? WHERE id = ?";
    db.query(sql, [status, reqstatus, requestId], (err, result) => {
        if (err) {
            console.error('Error updating status:', err);
            return res.status(500).json(err);
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }
        return res.json({ message: 'Status updated successfully', result });
    });
});

//retrieves missed days for specific user
app.get('/employeemisseddays/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM clockin WHERE employee_id = ? AND (clockinTime IS NULL OR clockinTime = '' OR clockoutTime IS NULL OR clockoutTime = '')";

    db.query(sql, [id], (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (data.length === 0) {
            return res.status(404).json({ message: "No Missed days found for this user" });
        }
        return res.json(data); // Return all matching records
    });
});

// Update the status of a missed day
app.patch('/updatemissedday/:id', (req, res) => {
    const requestId = req.params.id;
    const { clockinTime, clockoutTime } = req.body; // Get these values from the body

    console.log('Updating missed day with ID:', requestId); // Log the ID for debugging

    const sql = "UPDATE clockin SET clockinTime = ?, clockoutTime = ? WHERE id = ?";
    db.query(sql, [clockinTime, clockoutTime, requestId], (err, result) => {
        if (err) {
            console.error('Error updating missed day:', err);
            return res.status(500).json(err);
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No missed day found with the provided ID.' });
        }
        return res.json({ message: 'Missed day updated successfully', result });
    });
});

// Insert missed day into the database
app.post("/misseddayinsert", (req, res) => {
    const { employee_id, employee_name, date, clockinTime, clockoutTime, reason } = req.body;

    db.query(
        "INSERT INTO missed_days (`employee_id`, `employee_name`, `date`, `clockinTime`, `clockoutTime`, `reason`) VALUES (?,?,?,?,?,?)",
        [employee_id, employee_name, date, clockinTime, clockoutTime, reason],
        (err) => {
            if (err) {
                console.error('Error inserting missed day:', err);
                return res.status(500).json(err);
            }
            const misseddaydata = {
                employee_id,
                employee_name,
                date,
                clockinTime,
                clockoutTime,
                reason
            };
            res.json(misseddaydata);
        }
    );
});

//Uploading documents api

//Getting all docs for user
app.get('/getdocuments/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM documents WHERE employee_id = ? ";

    db.query(sql, [id], (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (data.length === 0) {
            return res.status(404).json({ message: "No documents found for this user" });
        }
        return res.json(data); // Return all matching records
    });
});

app.get('/getdocumentblob/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT doc FROM documents WHERE id = ?";

    db.query(sql, [id], (err, data) => {
        if (err) {
            console.error('Error fetching document blob:', err);
            return res.status(500).json({ message: "Error fetching document", error: err });
        }
        if (data.length === 0) {
            return res.status(404).json({ message: "Document not found" });
        }
        const document = data[0].doc;
        res.setHeader('Content-Type', 'application/pdf'); // or other appropriate mime type
        res.send(document); // Send the BLOB as the response
    });
});

// Deleting specific document
app.delete('/deletedocument/:id', (req, res) => {
    const { id } = req.params;

    // Get the document path first
    const sqlSelect = "SELECT doc FROM documents WHERE id = ?";
    db.query(sqlSelect, [id], (err, result) => {
        if (err) {
            console.error("Error retrieving document:", err);
            return res.status(500).json({ error: "Error retrieving document" });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "Document not found" });
        }

        const documentPath = result[0].doc; // Still retrieving the path, but not using it

        // Delete the document from the database
        const sqlDelete = "DELETE FROM documents WHERE id = ?";
        db.query(sqlDelete, [id], (err, deleteResult) => {
            if (err) {
                console.error('Error deleting document:', err);
                return res.status(500).json({ message: "Error deleting document", error: err });
            }

            if (deleteResult.affectedRows === 0) {
                return res.status(404).json({ message: "Document not found" });
            }

            // Log the deletion, but do not delete the file
            console.log(`Deleted document record with ID: ${id}, file path was: ${documentPath}`);
            res.sendStatus(204); // No content to send back
        });
    });
});


// Inserting document with path storage
app.post("/uploaddocument", upload.single("doc"), (req, res) => {
    console.log("Received data:", req.body); // Debugging log
    console.log("Received file:", req.file); // Debugging log

    const employee_id = req.body.employee_id;

    // Ensure the file and employee_id are present
    if (!req.file || !employee_id) {
        return res.status(400).json({ error: "File or employee_id is missing" });
    }

    const fileBuffer = req.file.buffer; // Access the file buffer
    const fileName = req.file.originalname; // Get the original filename
    const mimeType = req.file.mimetype; // Get the mime type of the file
    const date = new Date(); // Current date/time

    // Save the file metadata and buffer to the database as a BLOB
    db.query(
        "INSERT INTO documents (employee_id, doc, file_name, mime_type, date) VALUES (?, ?, ?, ?, ?)",
        [employee_id, fileBuffer, fileName, mimeType, date],
        (err, result) => {
            if (err) {
                console.error("Database insert error:", err);
                return res.status(500).json({ error: "Database insert error" });
            }

            const doclog = {
                id: result.insertId, // ID of the inserted document
                employee_id,
                file_name: fileName, // Name of the uploaded file
                mime_type: mimeType, // File MIME type
                date, // Submission date
            };

            res.json(doclog); // Return the inserted document details
        }
    );
});



// Endpoint to download a document by ID
app.get('/download/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT doc, file_name, mime_type FROM documents WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err || result.length === 0) {
            return res.status(404).send('Document not found');
        }

        const document = result[0].doc; // Binary data (BLOB)
        const fileName = result[0].file_name; // Original file name
        const mimeType = result[0].mime_type; // MIME type of the file

        // Set appropriate headers to handle the download
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', mimeType); // Set the correct MIME type
        res.end(document); // Send the file data (BLOB) to the client
    });
});


/////////Commissions apis
app.get('/getcommissions', (req, res) => {
    db.query('SELECT * FROM commissions ORDER BY id DESC', (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error retrieving commissions' });
        }
        console.log('Query Results:', results); // Log results for verification
        res.json(results); // Return all commission records
    });
});

////new commission
app.post('/addcommission', (req, res) => {
    const { employee_id, employee_name, employee_surname, item_name, sale_type, product_cost, vat, commission, date } = req.body;

    const query = 'INSERT INTO commissions (employee_id, employee_name, employee_surname, item_name, sale_type, product_cost, vat, commission, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

    db.query(query, [employee_id, employee_name, employee_surname, item_name, sale_type, product_cost, vat, commission, date], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error adding commission' });
        }
        res.json({ message: 'Commission added successfully', commissionId: results.insertId });
    });
});

//retrieves clockin details for specific user
app.get('/clockin/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM clockin WHERE employee_id = ? ORDER BY id DESC";

    db.query(sql, [id], (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (data.length === 0) {
            return res.status(404).json({ message: "No clocked days found for this user" });
        }
        return res.json(data); // Return all matching records
    });
});

// retrieves clockin details for the current month for a specific user
app.get('/employeeclockin/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT * 
        FROM clockin 
        WHERE employee_id = ? 
        AND MONTH(date) = MONTH(CURRENT_DATE())
        AND YEAR(date) = YEAR(CURRENT_DATE())
        ORDER BY id DESC
    `;

    db.query(sql, [id], (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (data.length === 0) {
            return res.status(404).json({ message: "No clocked days found for this user in the current month" });
        }
        return res.json(data); // Return records matching the current month
    });
});


app.post("/clockout", (req, res) => {
    console.log("Clock-out request received:", req.body);
    const { date, employee_id } = req.body;

    // Get the most recent clock-in record for today that doesn't have a clock-out time yet
    db.query(
        "SELECT * FROM clockin WHERE DATE(date) = DATE(?) AND employee_id = ? AND clockoutTime IS NULL ORDER BY id DESC LIMIT 1",
        [date, employee_id],
        (selectErr, selectResult) => {
            if (selectErr) {
                console.error("Error retrieving clockin record:", selectErr);
                return res.status(500).json({ error: 'Database error occurred while retrieving record' });
            }

            // Check if we found a record without a clock-out time
            if (!selectResult || selectResult.length === 0) {
                console.log("No clock-in record without a clock-out time found for today.");
                return res.status(404).json({ message: 'No clock-in record without a clock-out time found for today' });
            }

            console.log("Found record to update with clock-out time:", selectResult[0]);

            const currentRecord = selectResult[0];
            const now = new Date();

            // Get current time in HH:MM:SS format
            const currentTime = now.toTimeString().split(' ')[0];

            // If already clocked out, check if it's the same day and within working hours (8am-5pm)
            if (currentRecord.clockoutTime) {
                const currentHour = now.getHours();
                const currentDay = now.getDay(); // 0 is Sunday, 1-5 is Monday-Friday

                // Only allow multiple clock-ins/outs during work hours on weekdays
                if (currentDay >= 1 && currentDay <= 5 && currentHour >= 8 && currentHour < 17) {
                    // Add a new clock-in entry for the same day
                    // Note: Not using multiple_entry column since it doesn't exist in the database
                    db.query(
                        "INSERT INTO clockin (date, employee_id, clockinTime) VALUES (?, ?, ?)",
                        [date, employee_id, currentRecord.clockoutTime],
                        (insertErr, insertResult) => {
                            if (insertErr) {
                                console.error("Error creating additional clockin record:", insertErr);
                                return res.status(500).json({ error: 'Error creating additional clock-in record' });
                            }

                            console.log("Additional clock-in record created with previous clock-out time");
                            return res.json({
                                id: insertResult.insertId,
                                date,
                                employee_id,
                                message: 'Multiple clock-in record created',
                                clockinTime: currentRecord.clockoutTime
                            });
                        }
                    );
                    return;
                } else {
                    console.log("Already clocked out for today and outside working hours");
                    return res.json({
                        ...currentRecord,
                        message: 'Already clocked out for today'
                    });
                }
            }

            // Log the current time for debugging
            console.log("Current time for clock-out:", currentTime);

            // For debugging: log the structure of the clockin table
            db.query("DESCRIBE clockin", (describeErr, describeResult) => {
                if (describeErr) {
                    console.error("Error describing clockin table:", describeErr);
                } else {
                    console.log("Clockin table structure:", describeResult);
                }
            });

            // Calculate hours worked for logging purposes only
            let hoursWorked = null;
            if (currentRecord.clockinTime) {
                const clockInParts = currentRecord.clockinTime.split(':');
                const clockOutParts = currentTime.split(':');

                const clockInMinutes = parseInt(clockInParts[0]) * 60 + parseInt(clockInParts[1]);
                const clockOutMinutes = parseInt(clockOutParts[0]) * 60 + parseInt(clockOutParts[1]);

                hoursWorked = ((clockOutMinutes - clockInMinutes) / 60).toFixed(2);
                console.log("Hours worked (calculated):", hoursWorked);
            }

            // Update with explicit current time string format instead of NOW() function
            db.query(
                "UPDATE clockin SET clockoutTime = ? WHERE id = ?",
                [currentTime, currentRecord.id],
                (updateErr, updateResult) => {
                    if (updateErr) {
                        console.error("Error updating clockout:", updateErr);
                        return res.status(500).json({ error: 'Database error occurred during update' });
                    }

                    console.log("Clock-out record updated:", currentRecord.id, "Hours worked:", hoursWorked);
                    // Just return the current time in the response
                    return res.json({
                        ...currentRecord,
                        clockoutTime: currentTime,
                        message: 'Clock-out time updated'
                    });
                }
            );
        }
    );
});

app.post("/clockinset", (req, res) => {
    console.log("Clock-in request received:", req.body);
    const { date, employee_id } = req.body;

    // First check if a record exists for this employee on this date
    db.query(
        "SELECT * FROM clockin WHERE DATE(date) = DATE(?) AND employee_id = ?",
        [date, employee_id],
        (checkErr, checkResult) => {
            if (checkErr) {
                console.error("Error checking existing clockin record:", checkErr);
                return res.status(500).json({ error: 'Database error occurred during record check' });
            }

            if (checkResult.length === 0) {
                // No record exists, create a new one
                console.log("No clock-in record found for today. Creating new record.");

                // Create a new record and immediately query for the inserted record to get the exact time
                db.query(
                    "INSERT INTO clockin (date, employee_id, clockinTime) VALUES (?, ?, NOW())",
                    [date, employee_id],
                    (insertErr, insertResult) => {
                        if (insertErr) {
                            console.error("Error creating new clockin record:", insertErr);
                            return res.status(500).json({ error: 'Database error occurred while creating record' });
                        }

                        const insertId = insertResult.insertId;

                        // Get the actual record with the time set by the database
                        db.query(
                            "SELECT * FROM clockin WHERE id = ?",
                            [insertId],
                            (selectErr, selectResult) => {
                                if (selectErr) {
                                    console.error("Error retrieving new clockin record:", selectErr);
                                    return res.status(500).json({ error: 'Database error occurred retrieving record' });
                                }

                                const newRecord = selectResult[0];
                                console.log("New clock-in record created with time:", newRecord);
                                return res.json({
                                    ...newRecord,
                                    message: 'New clock-in record created'
                                });
                            }
                        );
                    }
                );
            } else {
                // Record exists, update it
                const existingRecord = checkResult[0];

                // Check if the user has clocked in and out already
                if (existingRecord.clockinTime && existingRecord.clockoutTime) {
                    console.log("User has already completed a clock-in/out cycle today, creating a new entry for multiple clock-ins");

                    // Create a new record for the additional clock-in on the same day
                    // Note: Not using multiple_entry column since it doesn't exist in the database
                    db.query(
                        "INSERT INTO clockin (date, employee_id, clockinTime) VALUES (?, ?, NOW())",
                        [date, employee_id],
                        (insertErr, insertResult) => {
                            if (insertErr) {
                                console.error("Error creating additional clockin record:", insertErr);
                                return res.status(500).json({ error: 'Error creating additional clock-in record' });
                            }

                            // Get the newly created record with the time
                            db.query(
                                "SELECT * FROM clockin WHERE id = ?",
                                [insertResult.insertId],
                                (selectErr, selectResult) => {
                                    if (selectErr) {
                                        console.error("Error retrieving new clockin record:", selectErr);
                                        return res.status(500).json({ error: 'Database error occurred retrieving record' });
                                    }

                                    const newRecord = selectResult[0];
                                    console.log("Additional clock-in record created:", newRecord);
                                    return res.json({
                                        ...newRecord,
                                        message: 'Additional clock-in record created'
                                    });
                                }
                            );
                        }
                    );
                    return;
                }
                // If already clocked in but not clocked out yet, don't update
                else if (existingRecord.clockinTime && !existingRecord.clockoutTime) {
                    console.log("Already clocked in today and not clocked out yet:", existingRecord);
                    return res.json({
                        ...existingRecord,
                        message: 'Already clocked in, please clock out first'
                    });
                }

                // Update the record with current time
                db.query(
                    "UPDATE clockin SET clockinTime = NOW() WHERE id = ?",
                    [existingRecord.id],
                    (updateErr, updateResult) => {
                        if (updateErr) {
                            console.error("Error updating clockin:", updateErr);
                            return res.status(500).json({ error: 'Database error occurred during update' });
                        }

                        // Get the updated record with the new time
                        db.query(
                            "SELECT * FROM clockin WHERE id = ?",
                            [existingRecord.id],
                            (selectErr, selectResult) => {
                                if (selectErr) {
                                    console.error("Error retrieving updated clockin record:", selectErr);
                                    return res.status(500).json({ error: 'Database error occurred retrieving record' });
                                }

                                const updatedRecord = selectResult[0];
                                console.log("Clock-in record updated with time:", updatedRecord);
                                return res.json({
                                    ...updatedRecord,
                                    message: 'Clock-in time updated'
                                });
                            }
                        );
                    }
                );
            }
        }
    );
});

////////// Getting roles
app.get('/roles/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM roles WHERE employee_id = ?";

    db.query(sql, [id], (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (data.length === 0) {
            return res.status(404).json({ message: "No roles found for this user" });
        }
        return res.json(data[0]); // Return all matching records
    });
});

app.post('/setroles/:id', (req, res) => {
    const { id } = req.params;
    // Assuming req.body contains the updated role fields
    const {
        clockin_out,
        view_clockin_details,
        request_report,
        request_leave,
        request_overtime,
        view_employees,
        edit_employee_details,
        delete_employee,
        view_clockin_history,
        view_employee_documents,
        view_your_documents,
        view_employee_missed_days,
        give_back_missed_day,
        register_staff,
        approve_request_overtime,
        approve_request_leave,
        approve_request_report,
        approve_leave_request,
        view_employee_payroll,
        set_employee_payroll,
        view_self_payroll_info,
        upload_own_documents,
        delete_own_documents,
        view_employee_commissions,
        create_new_commission,
    } = req.body;

    const sql = `
        UPDATE roles 
        SET 
            clockin_out = ?, 
            view_clockin_details = ?, 
            request_report = ?, 
            request_leave = ?, 
            request_overtime = ?, 
            view_employees = ?, 
            edit_employee_details = ?, 
            delete_employee = ?, 
            view_clockin_history = ?, 
            view_employee_documents = ?, 
            view_your_documents = ?, 
            view_employee_missed_days = ?, 
            give_back_missed_day = ?, 
            register_staff = ?, 
            approve_request_overtime = ?, 
            approve_request_leave = ?, 
            approve_request_report = ?, 
            approve_leave_request = ?, 
            view_employee_payroll = ?, 
            set_employee_payroll = ?, 
            view_self_payroll_info = ?, 
            upload_own_documents = ?, 
            delete_own_documents = ?, 
            view_employee_commissions = ?, 
            create_new_commission = ?
        WHERE employee_id = ?
    `;

    const values = [
        clockin_out,
        view_clockin_details,
        request_report,
        request_leave,
        request_overtime,
        view_employees,
        edit_employee_details,
        delete_employee,
        view_clockin_history,
        view_employee_documents,
        view_your_documents,
        view_employee_missed_days,
        give_back_missed_day,
        register_staff,
        approve_request_overtime,
        approve_request_leave,
        approve_request_report,
        approve_leave_request,
        view_employee_payroll,
        set_employee_payroll,
        view_self_payroll_info,
        upload_own_documents,
        delete_own_documents,
        view_employee_commissions,
        create_new_commission,
        id // employee_id should be the last value in the array
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No roles found for this user" });
        }
        return res.json({ message: "Roles updated successfully", affectedRows: result.affectedRows });
    });
});


// Fetch staff permissions for a specific employee
app.get('/staff_permissions/:employeeId', async (req, res) => {
    const { employeeId } = req.params;

    try {
        const query = 'SELECT permission_id FROM staff_permission WHERE employee_id = ?';
        db.query(query, [employeeId], (err, results) => {
            if (err) {
                console.error("Error fetching staff permissions:", err);
                return res.status(500).json({ error: "Failed to fetch staff permissions" });
            }

            // Ensure that results are returned as an array
            const permissions = Array.isArray(results) ? results : [results];

            res.json(permissions);
        });
    } catch (error) {
        console.error("Error in fetching staff permissions:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});


// Assign a permission to a specific staff member
app.post('/staff_permissions/assign', async (req, res) => {
    const { employee_id, permission_id } = req.body;
    try {
        await db.query(
            'INSERT INTO staff_permission (employee_id, permission_id) VALUES (?, ?)',
            [employee_id, permission_id]
        );
        res.status(200).json({ message: 'Permission assigned successfully' });
    } catch (err) {
        console.error('Error assigning permission:', err);
        res.status(500).json({ message: 'Failed to assign permission' });
    }
});

// Remove a specific permission from a staff member
app.delete('/staff_permissions/remove', async (req, res) => {
    const { employee_id, permission_id } = req.body;
    try {
        await db.query(
            'DELETE FROM staff_permission WHERE employee_id = ? AND permission_id = ?',
            [employee_id, permission_id]
        );
        res.status(200).json({ message: 'Permission removed successfully' });
    } catch (err) {
        console.error('Error removing permission:', err);
        res.status(500).json({ message: 'Failed to remove permission' });
    }
});

// Start server
// app.listen(8080, () => {
//     console.log("Server started on port 8080");
// });
