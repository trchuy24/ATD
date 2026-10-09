const { getDb } = require('../lib/mongodb');

async function migrate() {
  console.log('--- STARTING DATABASE MIGRATION ---');
  const db = await getDb();
  const subjectsColl = db.collection('subjects');
  const questionsColl = db.collection('questions');

  // 1. Fetch all subjects
  const subjects = await subjectsColl.find({}).toArray();
  console.log(`Found ${subjects.length} subjects in 'subjects' collection.`);

  // Create a mapping of subjectId -> parentId
  const subjectParentMap = {};

  for (const sub of subjects) {
    // Determine the proper parentId:
    // If it has parentId, use it. If it has group, use group. Otherwise null.
    let parentId = sub.parentId;
    if (!parentId && sub.group) {
      parentId = sub.group;
    }
    if (sub.isFolder) {
      parentId = null;
    } else if (!parentId && (sub.id.startsWith('cns') && sub.id !== 'cns')) {
      parentId = 'cns';
    } else if (parentId === undefined) {
      parentId = null;
    }

    subjectParentMap[sub.id] = parentId || null;

    // Update subject:
    // - Remove questions
    // - Remove icon
    // - Remove group
    // - Ensure parentId is set
    await subjectsColl.updateOne(
      { _id: sub._id },
      {
        $set: {
          parentId: parentId || null,
          updatedAt: new Date()
        },
        $unset: {
          questions: "",
          icon: "",
          group: ""
        }
      }
    );
    console.log(`Updated subject [${sub.id}]: parentId='${parentId || null}', removed questions, icon, group.`);
  }

  // 2. Update questions collection: add parentSubjectID to all questions
  const questions = await questionsColl.find({}).toArray();
  console.log(`Found ${questions.length} questions in 'questions' collection.`);

  let updatedCount = 0;
  for (const q of questions) {
    const parentSubjectID = subjectParentMap[q.subjectId] || null;

    await questionsColl.updateOne(
      { _id: q._id },
      {
        $set: {
          parentSubjectID: parentSubjectID
        }
      }
    );
    updatedCount++;
  }
  console.log(`Updated ${updatedCount} questions with parentSubjectID.`);

  // Create index for fast query by parentSubjectID and subjectId
  await questionsColl.createIndex({ subjectId: 1, id: 1 });
  await questionsColl.createIndex({ parentSubjectID: 1 });
  console.log('Created indexes on questions collection.');

  console.log('--- DATABASE MIGRATION COMPLETED SUCCESSFULLY ---');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
