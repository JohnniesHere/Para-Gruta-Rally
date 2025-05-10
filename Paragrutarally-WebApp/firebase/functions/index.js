// firebase/functions/index.js
// Main Cloud Functions entry point

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const xlsx = require("xlsx");
const fs = require("fs");
const os = require("os");
const path = require("path");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// Utility functions
const isAdmin = async (uid) => {
    try {
        const userDoc = await db.collection("users").doc(uid).get();
        return userDoc.exists && userDoc.data().role === "admin";
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
};

const isStaff = async (uid) => {
    try {
        const userDoc = await db.collection("users").doc(uid).get();
        return (
            userDoc.exists &&
            (userDoc.data().role === "staff" || userDoc.data().role === "admin")
        );
    } catch (error) {
        console.error("Error checking staff status:", error);
        return false;
    }
};

// Process Excel Import Function
exports.processExcelImport = functions.storage
    .object()
    .onFinalize(async (object) => {
        // Only process files in the imports directory
        if (!object.name.startsWith("imports/")) {
            return null;
        }

        // Get file path components
        const pathComponents = object.name.split("/");
        if (pathComponents.length < 4) {
            console.error("Invalid import file path:", object.name);
            return null;
        }

        const importType = pathComponents[1]; // kids, teams, etc.
        const userId = pathComponents[2];
        const fileName = pathComponents[3];

        // Validate user has permissions
        try {
            const hasPermission = await isStaff(userId);
            if (!hasPermission) {
                console.error("User does not have permission to import data:", userId);
                return null;
            }

            // Get the file from storage
            const bucket = storage.bucket(object.bucket);
            const tempFilePath = path.join(os.tmpdir(), fileName);

            await bucket.file(object.name).download({ destination: tempFilePath });
            console.log("File downloaded to", tempFilePath);

            // Read the Excel file
            const workbook = xlsx.readFile(tempFilePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = xlsx.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                throw new Error("Excel file contains no data");
            }

            // Start a batch operation
            const batch = db.batch();
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            // Process data based on import type
            if (importType === "kids") {
                for (const row of jsonData) {
                    try {
                        // Validate required fields
                        if (!row.firstName || !row.lastName) {
                            throw new Error("Missing required fields: firstName, lastName");
                        }

                        // Prepare data
                        const kidData = {
                            firstName: row.firstName,
                            lastName: row.lastName,
                            age: row.age ? parseInt(row.age, 10) : null,
                            gender: row.gender || null,
                            email: row.email || null,
                            phone: row.phone || null,
                            address: row.address || null,
                            emergencyContact: row.emergencyContact || null,
                            emergencyPhone: row.emergencyPhone || null,
                            teamId: row.teamId || null,
                            notes: row.notes || null,
                            importedBy: userId,
                            importedAt: admin.firestore.FieldValue.serverTimestamp(),
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        };

                        // Add to batch
                        const docRef = db.collection("kids").doc();
                        batch.set(docRef, kidData);
                        successCount++;
                    } catch (error) {
                        console.error("Error processing kid row:", error);
                        errorCount++;
                        errors.push({
                            row: row,
                            error: error.message,
                        });
                    }
                }
            } else if (importType === "teams") {
                for (const row of jsonData) {
                    try {
                        // Validate required fields
                        if (!row.name) {
                            throw new Error("Missing required field: name");
                        }

                        // Prepare data
                        const teamData = {
                            name: row.name,
                            description: row.description || null,
                            instructorId: row.instructorId || null,
                            type: row.type || "regular",
                            maxCapacity: row.maxCapacity ? parseInt(row.maxCapacity, 10) : null,
                            meetingDays: row.meetingDays || null,
                            meetingTime: row.meetingTime || null,
                            location: row.location || null,
                            notes: row.notes || null,
                            importedBy: userId,
                            importedAt: admin.firestore.FieldValue.serverTimestamp(),
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        };

                        // Add to batch
                        const docRef = db.collection("teams").doc();
                        batch.set(docRef, teamData);
                        successCount++;
                    } catch (error) {
                        console.error("Error processing team row:", error);
                        errorCount++;
                        errors.push({
                            row: row,
                            error: error.message,
                        });
                    }
                }
            }
            // Add more import types as needed

            // Commit the batch
            if (successCount > 0) {
                await batch.commit();
            }

            // Record import log
            await db.collection("importLogs").add({
                fileUrl: `gs://${object.bucket}/${object.name}`,
                fileName: fileName,
                importType: importType,
                totalRows: jsonData.length,
                successCount: successCount,
                errorCount: errorCount,
                errors: errors,
                importedBy: userId,
                importedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Clean up the temp file
            fs.unlinkSync(tempFilePath);

            console.log(
                `Import completed: ${successCount} records imported, ${errorCount} errors`
            );
            return { success: true, successCount, errorCount };
        } catch (error) {
            console.error("Error processing import:", error);
            return { success: false, error: error.message };
        }
    });

// HTTP Function: Generate Report
exports.generateReport = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        // Check authentication
        if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
            res.status(403).send("Unauthorized");
            return;
        }

        const idToken = req.headers.authorization.split("Bearer ")[1];

        try {
            // Verify the token
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const uid = decodedToken.uid;

            // Check permissions
            const hasPermission = await isStaff(uid);
            if (!hasPermission) {
                res.status(403).send("Insufficient permissions");
                return;
            }

            // Get report type from request
            const reportType = req.body.reportType;

            if (!reportType) {
                res.status(400).send("Missing report type");
                return;
            }

            // Process different report types
            if (reportType === "teamSummary") {
                // Get teams data
                const teamsSnapshot = await db.collection("teams").get();
                const teams = {};

                teamsSnapshot.forEach(doc => {
                    teams[doc.id] = { ...doc.data(), id: doc.id, kidCount: 0 };
                });

                // Get kids data and count by team
                const kidsSnapshot = await db.collection("kids").get();
                const kidsByTeam = {};

                kidsSnapshot.forEach(doc => {
                    const kid = doc.data();
                    const teamId = kid.teamId;

                    if (teamId) {
                        if (teams[teamId]) {
                            teams[teamId].kidCount++;
                        }

                        if (!kidsByTeam[teamId]) {
                            kidsByTeam[teamId] = [];
                        }

                        kidsByTeam[teamId].push({
                            id: doc.id,
                            name: `${kid.firstName} ${kid.lastName}`,
                            age: kid.age
                        });
                    }
                });

                // Create report
                const report = {
                    generatedAt: new Date().toISOString(),
                    generatedBy: uid,
                    type: "teamSummary",
                    data: Object.values(teams).map(team => ({
                        id: team.id,
                        name: team.name,
                        description: team.description,
                        instructor: team.instructorId,
                        kidCount: team.kidCount,
                        kids: kidsByTeam[team.id] || []
                    }))
                };

                // Save report to Firestore
                const reportRef = await db.collection("reports").add(report);

                res.status(200).json({
                    success: true,
                    reportId: reportRef.id,
                    report: report
                });

            } else if (reportType === "activityParticipation") {
                // Implement activity participation report
                // ...

                res.status(200).json({
                    success: true,
                    message: "Activity participation report generated"
                });

            } else {
                res.status(400).send(`Unsupported report type: ${reportType}`);
            }

        } catch (error) {
            console.error("Error generating report:", error);
            res.status(500).send(`Error generating report: ${error.message}`);
        }
    });
});

// Firestore Trigger: Update team stats when kid is added/removed
exports.updateTeamStats = functions.firestore
    .document("kids/{kidId}")
    .onWrite(async (change, context) => {
        try {
            const kidBefore = change.before.exists ? change.before.data() : null;
            const kidAfter = change.after.exists ? change.after.data() : null;

            // Get the team IDs before and after the change
            const teamBefore = kidBefore ? kidBefore.teamId : null;
            const teamAfter = kidAfter ? kidAfter.teamId : null;

            // If team hasn't changed and it's not a delete, no need to update
            if (teamBefore === teamAfter && kidAfter !== null) {
                return null;
            }

            // Update previous team stats if it existed
            if (teamBefore) {
                const teamRef = db.collection("teams").doc(teamBefore);
                const teamDoc = await teamRef.get();

                if (teamDoc.exists) {
                    // Get current count
                    const currentStats = teamDoc.data().stats || {};
                    const currentCount = currentStats.kidCount || 0;

                    // Update stats
                    await teamRef.update({
                        "stats.kidCount": Math.max(0, currentCount - 1),
                        "stats.updatedAt": admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            }

            // Update new team stats if it exists
            if (teamAfter) {
                const teamRef = db.collection("teams").doc(teamAfter);
                const teamDoc = await teamRef.get();

                if (teamDoc.exists) {
                    // Get current count
                    const currentStats = teamDoc.data().stats || {};
                    const currentCount = currentStats.kidCount || 0;

                    // Update stats
                    await teamRef.update({
                        "stats.kidCount": currentCount + 1,
                        "stats.updatedAt": admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            }

            return { success: true };
        } catch (error) {
            console.error("Error updating team stats:", error);
            return { success: false, error: error.message };
        }
    });

// Scheduled Function: Generate weekly summary email
exports.weeklyReportEmail = functions.pubsub
    .schedule("every monday 08:00")
    .timeZone("America/New_York") // Adjust to your time zone
    .onRun(async (context) => {
        try {
            // Get all staff and admin users
            const usersSnapshot = await db.collection("users")
                .where("role", "in", ["admin", "staff"])
                .get();

            if (usersSnapshot.empty) {
                console.log("No staff/admin users found");
                return null;
            }

            // Get weekly stats
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            // Count kids added in the last week
            const newKidsSnapshot = await db.collection("kids")
                .where("createdAt", ">=", oneWeekAgo)
                .get();

            const newKidsCount = newKidsSnapshot.size;

            // Count teams added in the last week
            const newTeamsSnapshot = await db.collection("teams")
                .where("createdAt", ">=", oneWeekAgo)
                .get();

            const newTeamsCount = newTeamsSnapshot.size;

            // Count forms submitted in the last week
            const newFormsSnapshot = await db.collection("formSubmissions")
                .where("submittedAt", ">=", oneWeekAgo)
                .get();

            const newFormsCount = newFormsSnapshot.size;

            // Create report data
            const reportData = {
                generatedAt: new Date().toISOString(),
                period: {
                    start: oneWeekAgo.toISOString(),
                    end: new Date().toISOString()
                },
                stats: {
                    newKids: newKidsCount,
                    newTeams: newTeamsCount,
                    newForms: newFormsCount
                }
            };

            // Save report to Firestore
            await db.collection("reports").add({
                ...reportData,
                type: "weeklySummary",
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Send email to each staff/admin user
            // Note: This requires setting up an email provider
            // This is just a placeholder for the actual email sending code
            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                if (userData.email) {
                    console.log(`Would send email to ${userData.email}`);
                    // Add actual email sending code here
                }
            }

            return { success: true };
        } catch (error) {
            console.error("Error generating weekly report:", error);
            return { success: false, error: error.message };
        }
    });