const mongoose = require('mongoose');
const Result = require('./models/Result');

// Test script to verify delete result functionality
async function testDeleteResult() {
  try {
    console.log('🧪 Testing delete result functionality...\n');

    // First, create a test result
    console.log('Step 1: Creating a test result...');
    const testResult = {
      studentId: new mongoose.Types.ObjectId(),
      schoolId: new mongoose.Types.ObjectId(),
      results: [{
        classId: new mongoose.Types.ObjectId(),
        examType: 'Test Exam',
        examName: 'Delete Test Exam',
        subjects: [
          { subjectName: 'Mathematics', maxMarks: 100, scoredMarks: 85, grade: 'A' },
          { subjectName: 'Science', maxMarks: 100, scoredMarks: 78, grade: 'B+' }
        ],
        date: new Date(),
        academicYear: '2024-25',
        term: 'Term 1'
      }]
    };

    const resultDoc = new Result(testResult);
    await resultDoc.save();
    console.log('✅ Test result created successfully');
    console.log(`   - Document ID: ${resultDoc._id}`);
    console.log(`   - Student ID: ${resultDoc.studentId}`);
    console.log(`   - School ID: ${resultDoc.schoolId}`);
    console.log(`   - Result ID: ${resultDoc.results[0]._id}`);

    // Test the delete functionality
    console.log('\nStep 2: Testing delete functionality...');
    const resultId = resultDoc.results[0]._id;
    
    // Simulate the delete operation
    const foundDoc = await Result.findOne({ 
      studentId: resultDoc.studentId, 
      schoolId: resultDoc.schoolId 
    });
    
    if (!foundDoc) {
      console.log('❌ ERROR: Result document not found');
      return;
    }

    const subResult = foundDoc.results.id(resultId);
    if (!subResult) {
      console.log('❌ ERROR: Specific result not found in results array');
      return;
    }

    // Delete the result
    foundDoc.results.pull({ _id: resultId });
    await foundDoc.save();
    
    console.log('✅ Result deleted successfully');
    console.log(`   - Remaining results: ${foundDoc.results.length}`);

    // Verify the result was actually deleted
    console.log('\nStep 3: Verifying deletion...');
    const verifyDoc = await Result.findOne({ 
      studentId: resultDoc.studentId, 
      schoolId: resultDoc.schoolId 
    });
    
    if (verifyDoc && verifyDoc.results.length === 0) {
      console.log('✅ SUCCESS: Result was completely deleted');
    } else if (verifyDoc && verifyDoc.results.length > 0) {
      console.log('❌ ERROR: Result still exists after deletion');
    } else {
      console.log('✅ SUCCESS: Result document was completely removed (no results left)');
    }

    // Clean up - delete the entire document if it exists
    await Result.deleteOne({ _id: resultDoc._id });
    console.log('🧹 Test data cleaned up');

    console.log('\n🎉 Delete result test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
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
    return testDeleteResult();
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

module.exports = testDeleteResult;



