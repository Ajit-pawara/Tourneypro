const express     = require('express');
const router      = express.Router();
const PointsTable = require('../models/PointsTable');
const Tournament  = require('../models/Tournament');
const { auth }    = require('../middleware/auth');

router.get('/:tid', async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.tid,'settings format');
    const cfg = (t?.settings?.toObject?t.settings.toObject():t?.settings)||{};
    const table = await PointsTable.find({tournament:req.params.tid})
      .populate('team','name shortName color city captain')
      .sort({points:-1,netSets:-1,netPoints:-1,won:-1});
    const ranked = table.map((e,i)=>({...e.toObject(),rank:i+1}));
    res.json({success:true,data:ranked,config:cfg});
  } catch(err){ res.status(500).json({success:false,message:err.message}); }
});

router.put('/:tid/team/:teamId', auth, async (req, res) => {
  try {
    const fields=['played','won','lost','drawn','points','setsWon','setsLost','pointsFor','pointsAgainst','straightWins','closeWins'];
    const update={manualEdit:true};
    fields.forEach(f=>{ if(req.body[f]!==undefined) update[f]=Number(req.body[f])||0; });
    const entry = await PointsTable.findOneAndUpdate(
      {tournament:req.params.tid,team:req.params.teamId},
      update,{new:true,upsert:true}
    ).populate('team','name shortName color');
    res.json({success:true,data:entry,message:'Points updated!'});
  } catch(err){ res.status(500).json({success:false,message:err.message}); }
});

router.delete('/:tid/team/:teamId', auth, async (req, res) => {
  try {
    await PointsTable.deleteOne({tournament:req.params.tid,team:req.params.teamId});
    res.json({success:true,message:'Entry removed.'});
  } catch(err){ res.status(500).json({success:false,message:err.message}); }
});

router.delete('/:tid', auth, async (req, res) => {
  try {
    await PointsTable.deleteMany({tournament:req.params.tid});
    res.json({success:true,message:'Points table reset.'});
  } catch(err){ res.status(500).json({success:false,message:err.message}); }
});

module.exports = router;
