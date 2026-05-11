////
import Marks from "../models/Marks.js";

export const getRank = async (req,res)=>{
    try {
    const {classAssigned, examName} = req.params;

    const marks = await Marks.find({
      classAssigned,
      examName,
    });

    if (marks.length === 0) {
      return res.status(404).json({
        message: "No marks found for this exam",
      });
    }
    //storing all student marks
    const totalStudents = {};

    marks.forEach((m)=>{
        const studentId = m.student.toString();
        
        if(!totalStudents[studentId]){
            totalStudents[studentId]=0;
        }
        totalStudents[studentId]+=m.marksObtained;
    });

    //converting the object to array...
    const totalsArray = Object.keys(totalStudents).map((studentId)=>({
        studentId,
        total: totalStudents[studentId],
    }));
    //descending totals
    totalsArray.sort((a,b)=> b.total-a.total);
    let currRank =1;
    let prevMarks = null;

    const rankedResults = totalsArray.map((item,ind)=>{
        if(prevMarks !==null && item.total< prevMarks){
            currRank = ind+1;
        }
        prevMarks = item.total;

        return{
            studentId: item.studentId,
            totalMarks: item.total,
            rank: currRank,
        };
    });
    res.status(200).json({
        classAssigned,
        examName,
        results: rankedResults,
        toppers: rankedResults.filter((r)=> r.rank ===1),
    })
    }catch (error) {
        res.status(500).json({
            msg:"Server Error",
        });
    }
};