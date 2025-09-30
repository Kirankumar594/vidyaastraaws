const mongoose = require('mongoose');
const Result = require('./models/Result');

// Test script to verify duplicate subject prevention
async function testDuplicateSubjectPrevention() {
  try {
    console.log('🧪 Testing duplicate subject prevention...\n');

    // Test 1: Creating a result with duplicate subjects should fail
    console.log('Test 1: Creating result with duplicate subjects (should fail)');
    const duplicateSubjectsResult = {
      studentId: new mongoose.Types.ObjectId(),
      schoolId: new mongoose.Types.ObjectId(),
      results: [{
        classId: new mongoose.Types.ObjectId(),
        examType: 'Midterm',
        examName: 'Test Exam',
        subjects: [
          { subjectName: 'Mathematics', maxMarks: 100, scoredMarks: 85, grade: 'A' },
          { subjectName: 'maths', maxMarks: 100, scoredMarks: 90, grade: 'A+' }, // Duplicate (case insensitive)
          { subjectName: 'Science', maxMarks: 100, scoredMarks: 78, grade: 'B+' }
        ],
        date: new Date(),
        academicYear: '2024-25',
        term: 'Term 1'
      }]
    };

    try {
      const result = new Result(duplicateSubjectsResult);
      await result.save();
      console.log('❌ ERROR: Duplicate subjects were allowed!');
    } catch (error) {
      if (error.message.includes('Duplicate subjects are not allowed')) {
        console.log('✅ SUCCESS: Duplicate subjects were correctly rejected');
      } else {
        console.log('❌ ERROR: Unexpected error:', error.message);
      }
    }

    // Test 2: Creating a result with unique subjects should succeed
    console.log('\nTest 2: Creating result with unique subjects (should succeed)');
    const uniqueSubjectsResult = {
      studentId: new mongoose.Types.ObjectId(),
      schoolId: new mongoose.Types.ObjectId(),
      results: [{
        classId: new mongoose.Types.ObjectId(),
        examType: 'Final',
        examName: 'Final Exam',
        subjects: [
          { subjectName: 'Mathematics', maxMarks: 100, scoredMarks: 85, grade: 'A' },
          { subjectName: 'Science', maxMarks: 100, scoredMarks: 78, grade: 'B+' },
          { subjectName: 'English', maxMarks: 100, scoredMarks: 92, grade: 'A+' }
        ],
        date: new Date(),
        academicYear: '2024-25',
        term: 'Term 2'
      }]
    };

    try {
      const result = new Result(uniqueSubjectsResult);
      await result.save();
      console.log('✅ SUCCESS: Unique subjects were correctly accepted');
      console.log('📊 Result details:');
      console.log(`   - Total subjects: ${result.results[0].subjects.length}`);
      console.log(`   - Total max marks: ${result.results[0].totalMaxMarks}`);
      console.log(`   - Total scored marks: ${result.results[0].totalScoredMarks}`);
      console.log(`   - Percentage: ${result.results[0].percentage}%`);
      
      // Clean up test data
      await Result.deleteOne({ _id: result._id });
      console.log('🧹 Test data cleaned up');
    } catch (error) {
      console.log('❌ ERROR: Unique subjects were rejected:', error.message);
    }

    console.log('\n🎉 Duplicate subject prevention test completed!');

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
    return testDuplicateSubjectPrevention();
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

module.exports = testDuplicateSubjectPrevention;



