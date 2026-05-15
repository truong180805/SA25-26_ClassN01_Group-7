"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../store/useAuthStore";
import ReactFlow, { Background, Controls, MiniMap, Handle, Position, useNodesState, useEdgesState, addEdge } from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { CheckCircle2, Circle, Plus, Trash2, Edit2, X, Zap, Lock } from 'lucide-react'; // <-- Thêm Lock
import TaskDetailDrawer from "./TaskDetailDrawer";

interface Task {
  id: string; title: string; content: string | null;
  priority: string; dueDate: string | null;
  isCompleted: boolean; parentId: string | null;
  isPinned: boolean; createdAt: string;
}

const getLayoutedElements = (nodes: any[], edges: any[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 80 }); 
  const nodeWidth = 280; const nodeHeight = 120;
  nodes.forEach((node) => { dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight }); });
  edges.forEach((edge) => { dagreGraph.setEdge(edge.source, edge.target); });
  dagre.layout(dagreGraph);
  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return { ...node, targetPosition: Position.Top, sourcePosition: Position.Bottom, position: { x: nodeWithPosition.x - nodeWidth / 2, y: nodeWithPosition.y - nodeHeight / 2 } };
    }), edges,
  };
};

export default function TaskSequenceView({ tasks, onRefresh, projectId, isStrictSequence }: { tasks: Task[], onRefresh: () => void, projectId: string, isStrictSequence: boolean }) {
  const { token } = useAuthStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [quickAddParentId, setQuickAddParentId] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState(""); const [content, setContent] = useState("");
  const [priority, setPriority] = useState("medium"); const [dueDate, setDueDate] = useState("");

  const toggleTaskStatus = async (task: Task) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${task.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isCompleted: !task.isCompleted }) });
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Xóa nhiệm vụ này?")) return;
    try {
      await fetch(`http://localhost:5000/api/tasks/${id}`, { method: "DELETE" });
      if (viewingTask?.id === id) setViewingTask(null);
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!quickAddTitle.trim()) return;
    const decoded: any = jwtDecode(token!);
    const body = { userId: decoded.userId, projectId, title: quickAddTitle, content: "", priority: "medium", dueDate: null, parentId: quickAddParentId };
    try {
      const res = await fetch("http://localhost:5000/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { onRefresh(); setIsQuickAddOpen(false); setQuickAddTitle(""); setQuickAddParentId(null); }
    } catch (err) { console.error(err); }
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!editingTask) return;
    const body = { title, content, priority, dueDate: dueDate || null };
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${editingTask.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { onRefresh(); setIsEditModalOpen(false); setEditingTask(null); }
    } catch (err) { console.error(err); }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task); setTitle(task.title); setContent(task.content || "");
    setPriority(task.priority); setDueDate(task.dueDate ? task.dueDate.split('T')[0] : "");
    setIsEditModalOpen(true);
  };

  const onConnect = useCallback(async (params: any) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${params.target}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ parentId: params.source }) });
      setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds));
      setTimeout(() => onRefresh(), 500); 
    } catch (error) { console.error(error); }
  }, [setEdges, onRefresh]);

  const onNodeDoubleClick = useCallback((event: any, node: any) => {
    setViewingTask(node.data.task);
  }, []);

  // --- CẬP NHẬT UI CUSTOM NODE ĐỂ HIỂN THỊ KHÓA ---
  const CustomNode = ({ data }: any) => {
    const { task, isLocked } = data;
    
    return (
      <div style={{ width: '280px', height: '120px' }} className={`bg-white rounded-2xl shadow-lg border-2 flex flex-col justify-between transition-all relative ${
        task.isCompleted ? 'border-green-500 opacity-80' : 
        isLocked ? 'border-gray-300 bg-gray-50 opacity-60' : // <-- Đổi màu nếu bị khóa
        'border-blue-500 hover:shadow-blue-200 cursor-pointer'
      }`}>
        <Handle type="target" position={Position.Top} className="w-4 h-4 !bg-gray-300 border-2 border-white" />
        
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            {/* Vô hiệu hóa nút bấm nếu bị khóa */}
            <button disabled={isLocked} onClick={() => { if(!isLocked) data.onToggle(task) }} className={`mt-0.5 shrink-0 transition-colors ${
              task.isCompleted ? 'text-green-500' : isLocked ? 'text-gray-400 cursor-not-allowed' : 'text-gray-300 hover:text-blue-500'
            }`}>
              {isLocked ? <Lock size={18} /> : task.isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            </button>
            <h4 className={`text-sm font-bold flex-1 truncate ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</h4>
          </div>

          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${task.priority === 'high' ? 'bg-red-50 text-red-500' : task.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-500'}`}>{task.priority}</span>
            <div className="flex space-x-1">
              <button onClick={() => data.onEdit(task)} className="p-1 text-gray-400 hover:text-blue-600 bg-gray-50 rounded" title="Chỉnh sửa"><Edit2 size={14}/></button>
              <button onClick={() => { setQuickAddParentId(task.id); setIsQuickAddOpen(true); }} className="p-1 text-gray-400 hover:text-blue-600 bg-gray-50 rounded" title="Thêm việc con nhanh"><Plus size={14}/></button>
              <button onClick={() => data.onDelete(task.id)} className="p-1 text-gray-400 hover:text-red-500 bg-gray-50 rounded" title="Xóa"><Trash2 size={14}/></button>
            </div>
          </div>
        </div>
        <Handle type="source" position={Position.Bottom} className="w-4 h-4 !bg-blue-500 border-2 border-white" />
      </div>
    );
  };
  const nodeTypes = useMemo(() => ({ customNode: CustomNode }), []);

  useEffect(() => {
    if(tasks.length === 0) { setNodes([]); setEdges([]); return; }
    
    const initialNodes = tasks.map(task => {
      // TÍNH TOÁN LOGIC KHÓA Ở ĐÂY
      const isLocked = isStrictSequence && task.parentId 
        ? tasks.find(t => t.id === task.parentId)?.isCompleted === false 
        : false;

      return {
        id: task.id, type: 'customNode', 
        data: { task, isLocked, onToggle: toggleTaskStatus, onEdit: openEditModal, onDelete: deleteTask }, 
        position: { x: 0, y: 0 }
      };
    });
    
    const initialEdges = tasks.filter(t => t.parentId).map(t => ({
      id: `e-${t.parentId}-${t.id}`, source: t.parentId, target: t.id, 
      animated: !t.isCompleted, style: { stroke: t.isCompleted ? '#22c55e' : '#3b82f6', strokeWidth: 2 }
    }));
    
    const layout = getLayoutedElements(initialNodes, initialEdges);
    setNodes(layout.nodes); setEdges(layout.edges);
  }, [tasks, isStrictSequence]); // Thêm isStrictSequence vào dependency

  // ... (Giữ nguyên phần HTML return ở dưới vì không cần thay đổi UI Modal) ...
  return (
    <>
      <div className="mb-4 flex justify-between items-end">
        <p className="text-sm text-gray-500 font-medium">💡 Hướng dẫn nhanh: Bấm Đúp vào thẻ để xem chi tiết. Cầm chấm xanh kéo nối vào chấm xám.</p>
        <button onClick={() => { setQuickAddParentId(null); setIsQuickAddOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center">
          <Zap size={18} className="mr-2"/> Thêm Nhanh
        </button>
      </div>

      <div className="h-[700px] bg-white rounded-3xl border border-gray-100 shadow-inner overflow-hidden relative">
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeDoubleClick={onNodeDoubleClick} fitView minZoom={0.2} maxZoom={1.5}>
          <Background color="#cbd5e1" gap={20} />
          <Controls />
        </ReactFlow>
      </div>

      {isQuickAddOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800 flex items-center"><Zap size={20} className="mr-2 text-blue-600"/> Thêm công việc thần tốc</h3>
              <button onClick={() => { setIsQuickAddOpen(false); setQuickAddTitle(""); setQuickAddParentId(null); }} className="text-gray-400 hover:text-gray-700"><X size={20}/></button>
            </div>
            <form onSubmit={handleQuickAdd}>
              <input autoFocus required className="w-full border-2 border-blue-500 p-4 rounded-xl text-lg font-bold text-gray-800 shadow-inner focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all" placeholder="Gõ tên nhiệm vụ và ấn Enter..." value={quickAddTitle} onChange={e => setQuickAddTitle(e.target.value)} />
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
            <div className="flex-1 p-8 border-r border-gray-100 flex flex-col">
              <input className="w-full text-2xl font-bold text-gray-800 placeholder:text-gray-300 outline-none mb-4" placeholder="Tên nhiệm vụ..." required value={title} onChange={e => setTitle(e.target.value)} />
              <textarea className="w-full text-gray-600 placeholder:text-gray-400 outline-none min-h-[150px] resize-none flex-1" placeholder="Ghi chú chi tiết..." value={content} onChange={e => setContent(e.target.value)} />
            </div>
            <div className="w-full md:w-72 bg-gray-50 flex flex-col">
              <div className="p-6 flex-1 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Độ ưu tiên</label>
                  <div className="flex flex-col gap-2">
                    {['high', 'medium', 'low'].map(p => (
                      <button key={p} type="button" onClick={() => setPriority(p)} className={`px-3 py-2 rounded-lg text-sm font-bold uppercase transition-all flex items-center justify-between border ${priority === p ? 'bg-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-400'}`}>
                        {p}{priority === p && <CheckCircle2 size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Hạn chót</label>
                  <input type="date" className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-sm font-bold text-gray-700 outline-none" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>
              <div className="p-6 bg-gray-100 border-t border-gray-200 flex justify-between items-center">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-gray-400 font-bold text-sm">HỦY</button>
                <button onClick={handleEditTask} className="bg-blue-600 text-white py-2 px-6 rounded-xl font-bold text-sm shadow-lg shadow-blue-100">LƯU LẠI</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <TaskDetailDrawer task={viewingTask} onClose={() => setViewingTask(null)} onToggleStatus={toggleTaskStatus} />
    </>
  );
}