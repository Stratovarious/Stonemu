// services/serverChessLogic.js

class ServerChessLogic {
  constructor() {
    this.history = [];
    this.loadFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  }

  reset() {
    this.loadFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    this.history = [];
  }

  loadFen(fen) {
    let parts = fen.split(' ');
    let position = parts[0];
    this.activeColor = parts[1];
    this.castlingRights = parts[2];
    this.enPassantTarget = parts[3] === '-' ? null : parts[3];
    this.halfmoveClock = parseInt(parts[4], 10);
    this.fullmoveNumber = parseInt(parts[5], 10);

    this.board = [];
    let rows = position.split('/');
    for (let i = 0; i < 8; i++) {
      let row = rows[i].split('');
      let boardRow = [];
      for (let j = 0; j < row.length; j++) {
        let c = row[j];
        if (/[1-8]/.test(c)) {
          let emptyCount = parseInt(c, 10);
          for (let k = 0; k < emptyCount; k++) boardRow.push("");
        } else {
          boardRow.push(c);
        }
      }
      this.board.push(boardRow);
    }
  }

  fen() {
    let fenRows = [];
    for (let i = 0; i < 8; i++) {
      let empty = 0;
      let rowFen = "";
      for (let j = 0; j < 8; j++) {
        let piece = this.board[i][j];
        if (piece === "") {
          empty++;
        } else {
          if (empty > 0) {
            rowFen += empty;
            empty = 0;
          }
          rowFen += piece;
        }
      }
      if (empty > 0) rowFen += empty;
      fenRows.push(rowFen);
    }
    let fenPos = fenRows.join('/');
    let ep = this.enPassantTarget ? this.enPassantTarget : '-';
    return fenPos + " " + this.activeColor + " " + this.castlingRights + " " + ep + " " + this.halfmoveClock + " " + this.fullmoveNumber;
  }

  turn() {
    return this.activeColor;
  }

  game_over() {
    let moves = this.getAllValidMovesForTurn();
    if (moves.length > 0) return false;
    // No moves left, checkmate or stalemate
    if (this.inCheck(this.activeColor)) {
      return true; // Checkmate
    } else {
      return true; // Stalemate
    }
  }

  move(m) {
    // Current turn color
    let moves = this.getAllValidMovesForTurn();
    let chosen = moves.find(M => M.from === m.from && M.to === m.to);
    if (!chosen) return null;

    this.makeMove(chosen);
    return m;
  }

  getAllValidMovesForTurn() {
    // Generate all moves and filter out illegal ones
    let moves = this.generateMoves(this.activeColor);
    let legal = [];
    for (let mv of moves) {
      this.makeMove(mv);
      if (!this.inCheck(this.activeColor === 'w' ? 'b' : 'w')) {
        legal.push(mv);
      }
      this.undoMove();
    }
    return legal;
  }

  getValidMoves(square) {
    // Get moves from a specific square
    let all = this.getAllValidMovesForTurn();
    return all.filter(m => m.from === square);
  }

  isOnBoard(r, f) { return r >= 0 && r < 8 && f >= 0 && f < 8; }

  pieceAt(r, f) { return this.board[r][f]; }

  colorOf(piece) {
    if (piece === "") return null;
    return piece === piece.toUpperCase() ? 'w' : 'b';
  }

  inCheck(color) {
    // Find king position
    let kingPos = this.findKing(color);
    if (!kingPos) return false;
    return this.squareAttackedBy(kingPos.r, kingPos.f, color === 'w' ? 'b' : 'w');
  }

  findKing(color) {
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        let p = this.board[r][f];
        if (p !== "") {
          let c = this.colorOf(p);
          if (c === color && p.toLowerCase() === 'k') return { r, f };
        }
      }
    }
    return null;
  }

  squareAttackedBy(r, f, attColor) {
    // Check if square (r,f) is attacked by attColor
    for (let rr = 0; rr < 8; rr++) {
      for (let ff = 0; ff < 8; ff++) {
        let p = this.board[rr][ff];
        if (p !== "" && this.colorOf(p) === attColor) {
          let moves = this.pseudoMoves(rr, ff, p);
          if (moves.some(m => m.tr === r && m.tf === f)) return true;
        }
      }
    }
    return false;
  }

  pseudoMoves(r, f, piece) {
    // Generate pseudo moves for a piece
    let color = this.colorOf(piece);
    let mvs = [];
    const add = (tr, tf) => {
      mvs.push({ from: this.coordsToSquare(r, f), to: this.coordsToSquare(tr, tf) });
    };

    const isOpp = (tr, tf) => (this.isOnBoard(tr, tf) && this.pieceAt(tr, tf) !== "" && this.colorOf(this.pieceAt(tr, tf)) !== color);
    const isEmpty = (tr, tf) => (this.isOnBoard(tr, tf) && this.pieceAt(tr, tf) === "");

    let pieceType = piece.toLowerCase();
    if (pieceType === 'p') {
      let dir = color === 'w' ? -1 : 1;
      let startRank = color === 'w' ? 6 : 1;
      let fr = r + dir;
      if (this.isOnBoard(fr, f) && this.pieceAt(fr, f) === "") add(fr, f);
      if (r === startRank && this.isOnBoard(fr + dir, f) && this.pieceAt(fr + dir, f) === "" && this.pieceAt(fr, f) === "") add(fr + dir, f);
      [f - 1, f + 1].forEach(tf => {
        if (this.isOnBoard(fr, tf)) {
          let tP = this.pieceAt(fr, tf);
          if (tP !== "" && this.colorOf(tP) !== color) add(fr, tf);
          // en passant
          if (this.enPassantTarget && this.squareToCoords(this.enPassantTarget).r === fr && this.squareToCoords(this.enPassantTarget).f === tf) {
            add(fr, tf);
          }
        }
      });
    }
    else if (pieceType === 'n') {
      let offs = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
      for (let off of offs) {
        let tr = r + off[0], tf = f + off[1];
        if (this.isOnBoard(tr, tf)) {
          let tp = this.pieceAt(tr, tf);
          if (tp === "" || this.colorOf(tp) !== color) add(tr, tf);
        }
      }
    }
    else if (pieceType === 'b') {
      this.addSliding(r, f, color, mvs, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
    }
    else if (pieceType === 'r') {
      this.addSliding(r, f, color, mvs, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
    }
    else if (pieceType === 'q') {
      this.addSliding(r, f, color, mvs, [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]);
    }
    else if (pieceType === 'k') {
      let kingOff = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
      for (let off of kingOff) {
        let tr = r + off[0], tf = f + off[1];
        if (this.isOnBoard(tr, tf)) {
          let tp = this.pieceAt(tr, tf);
          if (tp === "" || this.colorOf(tp) !== color) add(tr, tf);
        }
      }
      // Castling
      // Castling rights fen: KQkq
      let canCastleKing = (color === 'w' ? this.castlingRights.includes('K') : this.castlingRights.includes('k'));
      let canCastleQueen = (color === 'w' ? this.castlingRights.includes('Q') : this.castlingRights.includes('q'));
      let rank = color === 'w' ? 7 : 0;
      if (r === rank && f === 4) {
        // Short castling
        if (canCastleKing && this.pieceAt(rank, 5) === "" && this.pieceAt(rank, 6) === ""
          && !this.squareAttackedBy(rank, 4, this.opColor(color))
          && !this.squareAttackedBy(rank, 5, this.opColor(color))
          && !this.squareAttackedBy(rank, 6, this.opColor(color))) {
          add(rank, 6);
        }
        // Long castling
        if (canCastleQueen && this.pieceAt(rank, 3) === "" && this.pieceAt(rank, 2) === "" && this.pieceAt(rank, 1) === ""
          && !this.squareAttackedBy(rank, 4, this.opColor(color))
          && !this.squareAttackedBy(rank, 3, this.opColor(color))
          && !this.squareAttackedBy(rank, 2, this.opColor(color))) {
          add(rank, 2);
        }
      }
    }

    return mvs;
  }

  opColor(c) { return c === 'w' ? 'b' : 'w'; }

  addSliding(r, f, color, mvs, dirs) {
    for (let d of dirs) {
      let nr = r, nf = f;
      while (true) {
        nr += d[0]; nf += d[1];
        if (!this.isOnBoard(nr, nf)) break;
        let tp = this.pieceAt(nr, nf);
        if (tp === "") {
          mvs.push({ from: this.coordsToSquare(r, f), to: this.coordsToSquare(nr, nf) });
        } else {
          if (this.colorOf(tp) !== color) {
            mvs.push({ from: this.coordsToSquare(r, f), to: this.coordsToSquare(nr, nf) });
          }
          break;
        }
      }
    }
  }

  generateMoves(color) {
    // Generate all pseudo moves
    let moves = [];
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        let p = this.board[r][f];
        if (p !== "" && this.colorOf(p) === color) {
          let pmoves = this.pseudoMoves(r, f, p);
          // Handle promotion
          pmoves.forEach(mv => {
            const toRank = parseInt(mv.to.charAt(1));
            if (p.toLowerCase() === 'p' && (toRank === 1 || toRank === 8)) {
              moves.push({ from: mv.from, to: mv.to, promotion: 'q' }); // Auto promote to queen
            } else {
              moves.push({ from: mv.from, to: mv.to });
            }
          });
        }
      }
    }
    return moves;
  }

  coordsToSquare(r, f) {
    return String.fromCharCode("a".charCodeAt(0) + f) + (8 - r);
  }

  squareToCoords(sq) {
    let f = sq.charCodeAt(0) - "a".charCodeAt(0);
    let r = 8 - parseInt(sq.charAt(1));
    return { r, f };
  }

  makeMove(m) {
    this.history = this.history || [];
    let state = {
      board: this.board.map(row => row.slice()),
      activeColor: this.activeColor,
      castlingRights: this.castlingRights,
      enPassantTarget: this.enPassantTarget,
      halfmoveClock: this.halfmoveClock,
      fullmoveNumber: this.fullmoveNumber
    };
    this.history.push(state);

    let from = this.squareToCoords(m.from);
    let to = this.squareToCoords(m.to);
    let piece = this.board[from.r][from.f];
    let target = this.board[to.r][to.f];
    let color = this.colorOf(piece);

    // Update halfmove clock
    if (piece.toLowerCase() === 'p' || target !== "") {
      this.halfmoveClock = 0;
    } else {
      this.halfmoveClock++;
    }

    // Move piece
    this.board[to.r][to.f] = m.promotion || piece;
    this.board[from.r][from.f] = "";

    // En passant
    if (piece.toLowerCase() === 'p') {
      if (Math.abs(to.r - from.r) === 2) {
        // Double push
        this.enPassantTarget = String.fromCharCode("a".charCodeAt(0) + from.f) + (8 - ((from.r + to.r) / 2));
      } else {
        if (this.enPassantTarget && to.f === this.squareToCoords(this.enPassantTarget).f && to.r === this.squareToCoords(this.enPassantTarget).r) {
          // En passant capture
          let dir = color === 'w' ? 1 : -1;
          this.board[to.r + dir][to.f] = "";
        }
        this.enPassantTarget = null;
      }
    } else {
      this.enPassantTarget = null;
    }

    // Castling
    if (piece.toLowerCase() === 'k') {
      let rank = color === 'w' ? 7 : 0;
      if (from.f === 4 && to.f === 6 && from.r === rank && to.r === rank) {
        // Short castling
        this.board[rank][5] = this.board[rank][7];
        this.board[rank][7] = "";
      }
      if (from.f === 4 && to.f === 2 && from.r === rank && to.r === rank) {
        // Long castling
        this.board[rank][3] = this.board[rank][0];
        this.board[rank][0] = "";
      }
      // Remove castling rights
      if (color === 'w') {
        this.castlingRights = this.castlingRights.replace('K', '').replace('Q', '');
      } else {
        this.castlingRights = this.castlingRights.replace('k', '').replace('q', '');
      }
    }

    // Rook moved
    if (piece.toLowerCase() === 'r') {
      let rank = color === 'w' ? 7 : 0;
      if (from.r === rank && from.f === 0) {
        // a rook
        if (color === 'w') this.castlingRights = this.castlingRights.replace('Q', '');
        else this.castlingRights = this.castlingRights.replace('q', '');
      }
      if (from.r === rank && from.f === 7) {
        // h rook
        if (color === 'w') this.castlingRights = this.castlingRights.replace('K', '');
        else this.castlingRights = this.castlingRights.replace('k', '');
      }
    }

    // Rook captured
    if (target !== "") {
      // Captured rook affects castling rights
      if (to.r === 7 && to.f === 0) this.castlingRights = this.castlingRights.replace('Q', '');
      if (to.r === 7 && to.f === 7) this.castlingRights = this.castlingRights.replace('K', '');
      if (to.r === 0 && to.f === 0) this.castlingRights = this.castlingRights.replace('q', '');
      if (to.r === 0 && to.f === 7) this.castlingRights = this.castlingRights.replace('k', '');
    }

    // King moved
    if (piece.toLowerCase() === 'k') {
      // No castling for this color
      if (color === 'w') {
        this.castlingRights = this.castlingRights.replace('K', '').replace('Q', '');
      } else {
        this.castlingRights = this.castlingRights.replace('k', '').replace('q', '');
      }
    }

    // Switch turn
    this.activeColor = this.activeColor === 'w' ? 'b' : 'w';
    if (this.activeColor === 'w') this.fullmoveNumber++;
  }

  undoMove() {
    if (this.history.length === 0) return;
    let state = this.history.pop();
    this.board = state.board;
    this.activeColor = state.activeColor;
    this.castlingRights = state.castlingRights;
    this.enPassantTarget = state.enPassantTarget;
    this.halfmoveClock = state.halfmoveClock;
    this.fullmoveNumber = state.fullmoveNumber;
  }

  validate_move(m) {
    let moves = this.getAllValidMovesForTurn();
    return moves.some(mv => mv.from === m.from && mv.to === m.to);
  }
}

module.exports = ServerChessLogic;
