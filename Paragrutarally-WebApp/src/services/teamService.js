/**
 * Get a team with detailed information (kids, instructors, team leader)
 * FIXED VERSION - Properly fetches kids by IDs instead of teamId
 * @param {string} teamId - The team's document ID
 * @returns {Promise<Object|null>} Team data with details or null if not found
 */
export const getTeamWithDetails = async (teamId) => {
    try {
        console.log('🔄 Fetching team with details for:', teamId);

        // Get the basic team data
        const team = await getTeamById(teamId);
        if (!team) {
            console.log('❌ Team not found');
            return null;
        }

        console.log('📄 Basic team data:', team);

        // Initialize the detailed team object
        const teamWithDetails = {
            ...team,
            kids: [],
            instructors: [],
            teamLeader: null
        };

        // Fetch kids assigned to this team by kidIds array
        if (team.kidIds && team.kidIds.length > 0) {
            console.log('👶 Fetching kids by IDs:', team.kidIds);
            try {
                // Fetch kids by their IDs (more reliable than teamId filter)
                const kidsPromises = team.kidIds.map(async (kidId) => {
                    try {
                        const kidDoc = await getDoc(doc(db, 'kids', kidId));
                        if (kidDoc.exists()) {
                            return {
                                id: kidDoc.id,
                                ...kidDoc.data()
                            };
                        }
                        console.warn(`⚠️ Kid with ID ${kidId} not found`);
                        return null;
                    } catch (error) {
                        console.warn(`⚠️ Error fetching kid ${kidId}:`, error);
                        return null;
                    }
                });

                const kidsResults = await Promise.all(kidsPromises);
                teamWithDetails.kids = kidsResults.filter(kid => kid !== null);

                console.log('✅ Kids loaded:', teamWithDetails.kids.length, 'kids found');
                teamWithDetails.kids.forEach(kid => {
                    console.log(`  - Kid: ${kid.personalInfo?.firstName || 'Unknown'} (Status: ${kid.signedFormStatus || 'N/A'})`);
                });
            } catch (kidError) {
                console.warn('⚠️ Could not load kids:', kidError);
                teamWithDetails.kids = [];
            }
        } else {
            console.log('👶 No kids assigned to this team');
        }

        // Fetch instructors from users collection (based on instructorIds array)
        if (team.instructorIds && team.instructorIds.length > 0) {
            console.log('👥 Fetching instructors from users collection...');
            try {
                const instructorsPromises = team.instructorIds.map(instructorId => getUserById(instructorId));
                const instructorsResults = await Promise.all(instructorsPromises);
                teamWithDetails.instructors = instructorsResults.filter(instructor => instructor !== null);

                console.log('✅ Instructors loaded:', teamWithDetails.instructors.length);
            } catch (instructorError) {
                console.warn('⚠️ Could not load instructors:', instructorError);
                teamWithDetails.instructors = [];
            }
        }

        // Get team leader if specified
        if (team.teamLeaderId) {
            console.log('👑 Fetching team leader...');
            try {
                const leader = await getUserById(team.teamLeaderId);
                if (leader) {
                    teamWithDetails.teamLeader = leader;
                    console.log('✅ Team leader loaded:', leader.name);
                }
            } catch (leaderError) {
                console.warn('⚠️ Could not load team leader:', leaderError);
            }
        }

        console.log('🎉 Team with details completed:', {
            name: teamWithDetails.name,
            kidsCount: teamWithDetails.kids.length,
            instructorsCount: teamWithDetails.instructors.length,
            hasTeamLeader: !!teamWithDetails.teamLeader
        });

        return teamWithDetails;
    } catch (error) {
        console.error('💥 Error getting team with details:', error);
        throw new Error(`Failed to fetch team details: ${error.message}`);
    }
};