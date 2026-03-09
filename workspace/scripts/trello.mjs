#!/usr/bin/env node
// Poppy Trello CLI — uses TRELLO_API_KEY + TRELLO_TOKEN + TRELLO_BOARD_NAME

const KEY = process.env.TRELLO_API_KEY;
const TOKEN = process.env.TRELLO_TOKEN;
const BOARD_NAME = process.env.TRELLO_BOARD_NAME || 'WOOOF Recruitment';
const BASE = 'https://api.trello.com/1';

const q = p => `${BASE}${p}${p.includes('?') ? '&' : '?'}key=${KEY}&token=${TOKEN}`;

async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(q(path), opts);
  return res.json();
}

async function getBoard() {
  const boards = await api('/members/me/boards?fields=id,name');
  const board = boards.find(b => b.name === BOARD_NAME);
  if (!board) throw new Error(`Board "${BOARD_NAME}" not found. Available: ${boards.map(b=>b.name).join(', ')}`);
  return board;
}

async function getLists(boardId) {
  return api(`/boards/${boardId}/lists?fields=id,name`);
}

const cmd = process.argv[2];
const args = process.argv.slice(3);
const get = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i+1] : null; };

if (cmd === 'board') {
  const board = await getBoard();
  const lists = await getLists(board.id);
  console.log(JSON.stringify({ id: board.id, name: board.name, lists }, null, 2));

} else if (cmd === 'cards') {
  const board = await getBoard();
  const lists = await getLists(board.id);
  const listName = get('--list');
  const list = listName ? lists.find(l => l.name.toLowerCase().includes(listName.toLowerCase())) : null;
  const targetId = list ? list.id : null;
  const allCards = targetId
    ? await api(`/lists/${targetId}/cards?fields=id,name,desc,labels,url`)
    : await api(`/boards/${board.id}/cards?fields=id,name,idList,desc,labels,url`);
  const withList = allCards.map(c => ({
    ...c,
    list: lists.find(l => l.id === (c.idList || targetId))?.name
  }));
  console.log(JSON.stringify(withList, null, 2));

} else if (cmd === 'create') {
  const board = await getBoard();
  const lists = await getLists(board.id);
  const listName = get('--list') || 'Applied';
  const list = lists.find(l => l.name.toLowerCase().includes(listName.toLowerCase()));
  if (!list) throw new Error(`List "${listName}" not found`);
  const card = await api('/cards', 'POST', {
    idList: list.id,
    name: get('--name'),
    desc: get('--desc') || ''
  });
  console.log(JSON.stringify({ id: card.id, name: card.name, url: card.url, list: list.name }, null, 2));

} else if (cmd === 'move') {
  const board = await getBoard();
  const lists = await getLists(board.id);
  const cardId = get('--card');
  const listName = get('--list');
  const list = lists.find(l => l.name.toLowerCase().includes(listName.toLowerCase()));
  if (!list) throw new Error(`List "${listName}" not found`);
  const card = await api(`/cards/${cardId}`, 'PUT', { idList: list.id });
  console.log(JSON.stringify({ id: card.id, name: card.name, movedTo: list.name }, null, 2));

} else if (cmd === 'comment') {
  const cardId = get('--card');
  const text = get('--text');
  const result = await api(`/cards/${cardId}/actions/comments`, 'POST', { text });
  console.log(JSON.stringify({ success: !!result.id, id: result.id }, null, 2));

} else if (cmd === 'label') {
  const cardId = get('--card');
  const color = get('--color') || 'green';
  const name = get('--name') || '';
  const result = await api(`/cards/${cardId}/labels`, 'POST', { color, name });
  console.log(JSON.stringify({ success: true, label: result }, null, 2));

} else if (cmd === 'attach') {
  const cardId = get('--card');
  const url = get('--url');
  const name = get('--name') || '';
  const result = await api(`/cards/${cardId}/attachments`, 'POST', { url, name });
  console.log(JSON.stringify({ success: !!result.id, id: result.id }, null, 2));

} else if (cmd === 'search') {
  const query = args[0];
  const result = await api(`/search?query=${encodeURIComponent(query)}&card_fields=id,name,idList,url&cards_limit=10&modelTypes=cards`);
  console.log(JSON.stringify(result.cards, null, 2));

} else {
  console.error('Usage: trello.mjs <board|cards|create|move|comment|label|attach|search>');
  process.exit(1);
}
