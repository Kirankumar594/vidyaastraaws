const mongoose = require('mongoose');
const Result = require('./models/Result');

// Test script to identify the createResult error
async function testCreateResult() {
  try {
    console.log('🧪 Testing createResult functionality...\n');

    // Test 1: Valid result creation
    console.log('Test 1: Creating a valid result...');
    const validResult = {
      studentId: new mongoose.Types.ObjectId(),
      schoolId: new mongoose.Types.ObjectId(),
      results: [{
        classId: new mongoose.Types.ObjectId(),
        examType: 'Midterm',
        examName: 'Test Exam',
        subjects: [
          { subjectName: 'Mathematics', maxMarks: 100, scoredMarks: 85, grade: 'A' },
          { subjectName: 'Science', maxMarks: 100, scoredMarks: 78, grade: 'B+' }
        ],
        date: new Date(),
        academicYear: '2024-25',
        term: 'Term 1'
      }]
    };

    try {
      const resultDoc = new Result(validResult);
      await resultDoc.save();
      console.log('✅ SUCCESS: Valid result created successfully');
      console.log(`   - Document ID: ${resultDoc._id}`);
      console.log(`   - Results count: ${resultDoc.results.length}`);
      console.log(`   - Total max marks: ${resultDoc.results[0].totalMaxMarks}`);
      console.log(`   - Total scored marks: ${resultDoc.results[0].totalScoredMarks}`);
      console.log(`   - Percentage: ${resultDoc.results[0].percentage}%`);
      
      // Clean up
      await Result.deleteOne({ _id: resultDoc._id });
      console.log('🧹 Test data cleaned up');
    } catch (error) {
      console.log('❌ ERROR creating valid result:', error.message);
      console.log('   Error details:', error);
    }

    // Test 2: Invalid result with duplicate subjects
    console.log('\nTest 2: Creating result with duplicate subjects (should fail)...');
    const duplicateSubjectsResult = {
      studentId: new mongoose.Types.ObjectId(),
      schoolId: new mongoose.Types.ObjectId(),
      results: [{
        classId: new mongoose.Types.ObjectId(),
        examType: 'Final',
        examName: 'Final Exam',
        subjects: [
          { subjectName: 'Mathematics', maxMarks: 100, scoredMarks: 85, grade: 'A' },
          { subjectName: 'maths', maxMarks: 100, scoredMarks: 90, grade: 'A+' }, // Duplicate
          { subjectName: 'Science', maxMarks: 100, scoredMarks: 78, grade: 'B+' }
        ],
        date: new Date(),
        academicYear: '2024-25',
        term: 'Term 2'
      }]
    };

    try {
      const resultDoc = new Result(duplicateSubjectsResult);
      await resultDoc.save();
      console.log('❌ ERROR: Duplicate subjects were allowed!');
      // Clean up if somehow it was created
      await Result.deleteOne({ _id: resultDoc._id });
    } catch (error) {
      if (error.message.includes('Duplicate subjects are not allowed')) {
        console.log('✅ SUCCESS: Duplicate subjects were correctly rejected');
      } else {
        console.log('❌ ERROR: Unexpected error for duplicate subjects:', error.message);
      }
    }

    // Test 3: Invalid result with missing required fields
    console.log('\nTest 3: Creating result with missing required fields (should fail)...');
    const invalidResult = {
      studentId: new mongoose.Types.ObjectId(),
      schoolId: new mongoose.Types.ObjectId(),
      results: [{
        classId: new mongoose.Types.ObjectId(),
        examType: 'Test',
        // Missing examName, subjects, date
        academicYear: '2024-25',
        term: 'Term 1'
      }]
    };

    try {
      const resultDoc = new Result(invalidResult);
      await resultDoc.save();
      console.log('❌ ERROR: Invalid result was allowed!');
      // Clean up if somehow it was created
      await Result.deleteOne({ _id: resultDoc._id });
    } catch (error) {
      console.log('✅ SUCCESS: Invalid result was correctly rejected');
      console.log('   Error message:', error.message);
    }

    // Test 4: Test with invalid ObjectId format
    console.log('\nTest 4: Creating result with invalid ObjectId format (should fail)...');
    const invalidObjectIdResult = {
      studentId: 'invalid-object-id',
      schoolId: new mongoose.Types.ObjectId(),
      results: [{
        classId: new mongoose.Types.ObjectId(),
        examType: 'Test',
        examName: 'Test Exam',
        subjects: [
          { subjectName: 'Mathematics', maxMarks: 100, scoredMarks: 85, grade: 'A' }
        ],
        date: new Date(),
        academicYear: '2024-25',
        term: 'Term 1'
      }]
    };

    try {
      const resultDoc = new Result(invalidObjectIdResult);
      await resultDoc.save();
      console.log('❌ ERROR: Invalid ObjectId was allowed!');
      // Clean up if somehow it was created
      await Result.deleteOne({ _id: resultDoc._id });
    } catch (error) {
      console.log('✅ SUCCESS: Invalid ObjectId was correctly rejected');
      console.log('   Error message:', error.message);
    }

    console.log('\n🎉 CreateResult test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('   Full error:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  // Connect to MongoDB (you may need to adjust the connection string)
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vidyaastra', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('📡 Connected to MongoDB');
    return testCreateResult();
  })
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
}

module.exports = testCreateResult;
