import React, { useEffect, useState, FormEvent } from 'react';
import { investmentNoteAPI, stockAPI } from '../services/api';
import { InvestmentNote, Stock } from '../types';

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<InvestmentNote[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<InvestmentNote | null>(null);
  const [formData, setFormData] = useState({
    stock_id: '',
    title: '',
    content: '',
    tags: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const [notesRes, stocksRes] = await Promise.all([
        investmentNoteAPI.getInvestmentNotes(),
        stockAPI.getStocks({ skip: 0, limit: 100 }),
      ]);
      setNotes(notesRes.data);
      setStocks(stocksRes.data);
    } catch (error) {
      console.error('获取投资笔记失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleAdd = () => {
    setEditingNote(null);
    setFormData({ stock_id: '', title: '', content: '', tags: '' });
    setModalVisible(true);
  };

  const handleEdit = (note: InvestmentNote) => {
    setEditingNote(note);
    setFormData({
      stock_id: note.stock_id.toString(),
      title: note.title,
      content: note.content,
      tags: note.tags.join(', '),
    });
    setModalVisible(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        stock_id: Number(formData.stock_id),
        title: formData.title,
        content: formData.content,
        tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()) : [],
      };

      if (editingNote) {
        await investmentNoteAPI.updateInvestmentNote(editingNote.id, data);
      } else {
        await investmentNoteAPI.createInvestmentNote(data);
      }

      setModalVisible(false);
      fetchNotes();
    } catch (error) {
      console.error('操作失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await investmentNoteAPI.deleteInvestmentNote(id);
      fetchNotes();
    } catch (error) {
      console.error('删除失败:', error);
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <div>
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={handleAdd}
            className="btn-primary px-4 py-2.5 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建笔记
          </button>
          <button
            onClick={fetchNotes}
            disabled={loading}
            className="btn-secondary px-4 py-2.5 flex items-center gap-2"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  标题
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  股票
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  标签
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    <svg className="animate-spin h-8 w-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    加载中...
                  </td>
                </tr>
              ) : notes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    暂无笔记
                  </td>
                </tr>
              ) : (
                notes.map((note) => (
                  <tr key={note.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{note.title}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {(() => {
                        const stock = stocks.find(s => s.id === note.stock_id);
                        return stock ? (
                          <span className="inline-block px-2.5 py-1 text-xs font-medium bg-primary-50 text-primary-700 rounded-md">
                            {stock.code} - {stock.name}
                          </span>
                        ) : '-';
                      })()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {note.tags.map((tag, idx) => (
                          <span key={idx} className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                      {new Date(note.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(note)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          编辑
                        </button>
                        {deleteConfirm === note.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDelete(note.id)}
                              className="px-3 py-1.5 text-sm font-medium text-danger-600 bg-danger-50 rounded-lg hover:bg-danger-100"
                            >
                              确认
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(note.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-danger-600 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            删除
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalVisible && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setModalVisible(false)}
            />

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingNote ? '编辑笔记' : '新建笔记'}
                </h3>
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="stock_id" className="label">股票</label>
                    <select
                      id="stock_id"
                      value={formData.stock_id}
                      onChange={(e) => setFormData({ ...formData, stock_id: e.target.value })}
                      className="input"
                      required
                    >
                      <option value="">请选择股票</option>
                      {stocks.map(stock => (
                        <option key={stock.id} value={stock.id}>
                          {stock.code} - {stock.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="title" className="label">标题</label>
                    <input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="input"
                      placeholder="请输入笔记标题"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="content" className="label">内容</label>
                    <textarea
                      id="content"
                      rows={6}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="input"
                      placeholder="请输入笔记内容"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="tags" className="label">标签</label>
                    <input
                      id="tags"
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="input"
                      placeholder="多个标签用逗号分隔"
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setModalVisible(false)}
                      className="btn-secondary"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      保存
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
