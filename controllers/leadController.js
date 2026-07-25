const Lead = require('../models/Lead');
const Note = require('../models/Note');
const Activity = require('../models/Activity');

// Helper function to log activity
const logActivity = async (action, leadId, userId = null) => {
  await Activity.create({ action, lead: leadId, user: userId });
};

// @desc    Create a lead (Public Website)
// @route   POST /api/leads
// @access  Public
const createLead = async (req, res) => {
  try {
    const { name, email, phone, company, requirement, budget } = req.body;

    const lead = await Lead.create({
      name,
      email,
      phone,
      company,
      requirement,
      budget,
    });

    await logActivity('Lead Created', lead._id);

    res.status(201).json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all leads with pagination, filtering, searching
// @route   GET /api/leads
// @access  Private (Admin gets all, Member gets assigned)
const getLeads = async (req, res) => {
  try {
    const pageSize = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;

    // Search
    const keyword = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: 'i' } },
            { company: { $regex: req.query.search, $options: 'i' } },
          ],
        }
      : {};

    // Filter by status
    const statusFilter = req.query.status ? { status: req.query.status } : {};

    // Role-based access
    const roleFilter = req.user.role === 'admin' ? {} : { assignedTo: req.user._id };

    const query = { ...keyword, ...statusFilter, ...roleFilter };

    const count = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    res.json({ leads, page, pages: Math.ceil(count / pageSize), total: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update lead (Status, AssignedTo)
// @route   PATCH /api/leads/:id
// @access  Private
const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Check if member is authorized to update this lead
    if (req.user.role === 'member' && lead.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this lead' });
    }

    const { status, assignedTo } = req.body;

    if (status && lead.status !== status) {
      await logActivity(`Status changed to ${status}`, lead._id, req.user._id);
      lead.status = status;
    }

    // Only admin can assign
    if (assignedTo && req.user.role === 'admin' && lead.assignedTo?.toString() !== assignedTo) {
      lead.assignedTo = assignedTo;
      await logActivity(`Assigned to new user`, lead._id, req.user._id);
    }

    const updatedLead = await lead.save();
    res.json(updatedLead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a lead
// @route   DELETE /api/leads/:id
// @access  Private/Admin
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    await lead.deleteOne();
    // Also delete associated notes and activity
    await Note.deleteMany({ lead: lead._id });
    await Activity.deleteMany({ lead: lead._id });

    res.json({ message: 'Lead removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a note to a lead
// @route   POST /api/leads/:id/notes
// @access  Private
const addNote = async (req, res) => {
  try {
    const { message } = req.body;
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    if (req.user.role === 'member' && lead.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add notes to this lead' });
    }

    const note = await Note.create({
      message,
      author: req.user._id,
      lead: lead._id,
    });

    await logActivity(`Added Note: ${message.substring(0, 20)}...`, lead._id, req.user._id);

    res.status(201).json(note);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get lead details (with notes & activity)
// @route   GET /api/leads/:id
// @access  Private
const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name email');

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    if (req.user.role === 'member' && lead.assignedTo?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this lead' });
    }

    const notes = await Note.find({ lead: lead._id }).populate('author', 'name').sort({ createdAt: -1 });
    const activities = await Activity.find({ lead: lead._id }).populate('user', 'name').sort({ createdAt: -1 });

    res.json({ lead, notes, activities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createLead, getLeads, updateLead, deleteLead, addNote, getLeadById };
