const express     = require('express');
const router      = express.Router();
const Tournament  = require('../models/Tournament');
const Team        = require('../models/Team');
const Match       = require('../models/Match');
const PointsTable = require('../models/PointsTable');
const { auth }    = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const data = await Tournament.find().populate('teams','name shortName color').sort({createdAt:-1});
    res.json({ success:true, data });
  } catch(err) { res.status(500).json({success:false,message:err.message}); }
});

router.get('/:id', async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id).populate('teams');
    if(!t) return res.status(404).json({success:false,message:'Not found'});
    res.json({success:true,data:t});
  } catch(err) { res.status(500).json({success:false,message:err.message}); }
});

router.post('/', auth, async (req, res) => {
  try {
    const t = new Tournament(req.body);
    await t.save();
    res.status(201).json({success:true,data:t,message:'Tournament created!'});
  } catch(err) { res.status(400).json({success:false,message:err.message}); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const t = await Tournament.findByIdAndUpdate(req.params.id, req.body, {new:true,runValidators:true});
    if(!t) return res.status(404).json({success:false,message:'Not found'});
    res.json({success:true,data:t,message:'Tournament updated!'});
  } catch(err) { res.status(400).json({success:false,message:err.message}); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Tournament.findByIdAndDelete(req.params.id);
    await Match.deleteMany({tournament:req.params.id});
    await PointsTable.deleteMany({tournament:req.params.id});
    res.json({success:true,message:'Tournament deleted.'});
  } catch(err) { res.status(500).json({success:false,message:err.message}); }
});

router.get('/:id/settings', async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id,'settings sport name');
    if(!t) return res.status(404).json({success:false,message:'Not found'});
    res.json({success:true,data:t.settings||{},sport:t.sport,name:t.name});
  } catch(err) { res.status(500).json({success:false,message:err.message}); }
});

router.put('/:id/settings', auth, async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id);
    if(!t) return res.status(404).json({success:false,message:'Not found'});
    const ex = t.settings?.toObject ? t.settings.toObject() : (t.settings||{});
    t.settings = {...ex,...req.body};
    if(req.body.sport) t.sport = req.body.sport;
    await t.save();
    res.json({success:true,data:t.settings,message:'Settings saved!'});
  } catch(err) { res.status(500).json({success:false,message:err.message}); }
});

router.post('/:id/teams', auth, async (req, res) => {
  try {
    const {teamId} = req.body;
    const t = await Tournament.findById(req.params.id);
    if(!t) return res.status(404).json({success:false,message:'Not found'});
    if(t.teams.map(String).includes(String(teamId)))
      return res.status(400).json({success:false,message:'Team already added'});
    t.teams.push(teamId);
    await t.save();
    await Team.findByIdAndUpdate(teamId,{$addToSet:{tournaments:t._id}});
    if(t.format==='league'){
      const ex = await PointsTable.findOne({tournament:t._id,team:teamId});
      if(!ex) await PointsTable.create({tournament:t._id,team:teamId});
    }
    res.json({success:true,message:'Team added!'});
  } catch(err) { res.status(500).json({success:false,message:err.message}); }
});

router.delete('/:id/teams/:teamId', auth, async (req, res) => {
  try {
    await Tournament.findByIdAndUpdate(req.params.id,{$pull:{teams:req.params.teamId}});
    await Team.findByIdAndUpdate(req.params.teamId,{$pull:{tournaments:req.params.id}});
    await PointsTable.deleteOne({tournament:req.params.id,team:req.params.teamId});
    res.json({success:true,message:'Team removed.'});
  } catch(err) { res.status(500).json({success:false,message:err.message}); }
});

router.post('/:id/generate-fixtures', auth, async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id).populate('teams');
    if(!t) return res.status(404).json({success:false,message:'Not found'});
    if(t.teams.length<2) return res.status(400).json({success:false,message:'Need at least 2 teams.'});
    await Match.deleteMany({tournament:t._id,status:'scheduled'});
    const teams=t.teams, fixtures=[], start=new Date(t.startDate);
    let day=0;
    if(t.format==='league'){
      for(let i=0;i<teams.length;i++) for(let j=i+1;j<teams.length;j++){
        const d=new Date(start); d.setDate(start.getDate()+day++);
        fixtures.push({tournament:t._id,team1:teams[i]._id,team2:teams[j]._id,matchDate:d,round:'League Stage',roundNo:1});
      }
    } else {
      const sh=[...teams].sort(()=>Math.random()-.5);
      const rn=sh.length>=16?'Round of 16':sh.length>=8?'Quarter Finals':sh.length>=4?'Semi Finals':'Final';
      for(let i=0;i+1<sh.length;i+=2){
        const d=new Date(start); d.setDate(start.getDate()+day++);
        fixtures.push({tournament:t._id,team1:sh[i]._id,team2:sh[i+1]._id,matchDate:d,round:rn,roundNo:1});
      }
    }
    await Match.insertMany(fixtures);
    t.fixturesGenerated=true; t.status='ongoing'; await t.save();
    res.json({success:true,message:`${fixtures.length} fixtures generated!`,count:fixtures.length});
  } catch(err) { res.status(500).json({success:false,message:err.message}); }
});

module.exports = router;
