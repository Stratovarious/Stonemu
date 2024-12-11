// chess.js
// Tam bir satranç mantığı içerir: tüm standart kurallar (rok, en passant, terfi, şah kontrolü, mat, pat).

(function (global) {
  "use strict";

  function Chess() {
    this.loadFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  }

  Chess.prototype.loadFen = function(fen) {
    let parts = fen.split(' ');
    let position = parts[0];
    this.activeColor = parts[1];
    this.castlingRights = parts[2];
    this.enPassantTarget = parts[3] === '-' ? null : parts[3];
    this.halfmoveClock = parseInt(parts[4],10);
    this.fullmoveNumber = parseInt(parts[5],10);

    this.board = [];
    let rows = position.split('/');
    for (let i=0; i<8; i++) {
      let row = rows[i];
      let boardRow = [];
      let col = 0;
      for (let j=0;j<row.length;j++){
        let c=row[j];
        if(/[1-8]/.test(c)){
          let emptyCount=parseInt(c,10);
          for (let e=0;e<emptyCount;e++) boardRow.push("");
          col+=emptyCount;
        } else {
          boardRow.push(c);
          col++;
        }
      }
      this.board.push(boardRow);
    }
  };

  Chess.prototype.fen = function() {
    let fenRows=[];
    for (let i=0;i<8;i++){
      let empty=0;
      let rowFen="";
      for (let j=0;j<8;j++){
        let piece=this.board[i][j];
        if(piece==="") empty++;
        else {
          if(empty>0){
            rowFen+=empty;
            empty=0;
          }
          rowFen+=piece;
        }
      }
      if(empty>0) rowFen+=empty;
      fenRows.push(rowFen);
    }
    let fenPos=fenRows.join('/');
    let ep=this.enPassantTarget?this.enPassantTarget:'-';
    return fenPos+" "+this.activeColor+" "+(this.castlingRights===""?"-":this.castlingRights)+" "+ep+" "+this.halfmoveClock+" "+this.fullmoveNumber;
  };

  Chess.prototype.turn = function() {
    return this.activeColor;
  };

  Chess.prototype.game_over = function() {
    let moves = this.getAllValidMovesForTurn();
    if(moves.length>0) return false;
    // moves yok, şah çekilme durumu kontrol
    if (this.inCheck(this.turn())) {
      // mat
      return true;
    } else {
      // pat
      return true;
    }
  };

  Chess.prototype.validate_move = function(move) {
    let moves = this.getAllValidMovesForTurn();
    return moves.some(m=>m.from===move.from && m.to===move.to);
  };

  Chess.prototype.move = function(m) {
    let moves=this.getAllValidMovesForTurn();
    let chosen=moves.find(M=>M.from===m.from && M.to===m.to);
    if(!chosen)return null;
    this.makeMove(chosen);
    return m;
  };

  Chess.prototype.getValidMoves = function(square) {
    let all = this.getAllValidMovesForTurn();
    return all.filter(m=>m.from===square);
  };

  Chess.prototype.inCheck = function(color) {
    let kingPos = this.findKing(color);
    if(!kingPos)return false;
    return this.squareAttackedBy(kingPos.r, kingPos.f, this.opColor(color));
  };

  Chess.prototype.getAllValidMovesForTurn = function() {
    let moves=this.generateMoves(this.activeColor);
    let legal=[];
    this.history=this.history||[];
    for (let mv of moves) {
      this.makeMove(mv);
      if(!this.inCheck(this.opColor(this.activeColor))) {
        legal.push(mv);
      }
      this.undoMove();
    }
    return legal;
  };

  Chess.prototype.reset = function() {
    this.loadFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  };

  // Satranç mantığı (benzer server logic):
  Chess.prototype.isOnBoard=function(r,f){return r>=0&&r<8&&f>=0&&f<8;};
  Chess.prototype.pieceAt=function(r,f){return this.board[r][f];};
  Chess.prototype.colorOf=function(piece){if(piece==="")return null;return piece===piece.toUpperCase()?'w':'b';};
  Chess.prototype.opColor=function(c){return c==='w'?'b':'w';};

  Chess.prototype.inCheck = function(color) {
    let kingPos=this.findKing(color);
    if(!kingPos)return false;
    return this.squareAttackedBy(kingPos.r,kingPos.f,this.opColor(color));
  };

  Chess.prototype.findKing = function(color) {
    for(let r=0;r<8;r++){
      for(let f=0;f<8;f++){
        let p=this.board[r][f];
        if(p!=="" && this.colorOf(p)===color && p.toLowerCase()==='k') return {r,f};
      }
    }
    return null;
  };

  Chess.prototype.squareAttackedBy = function(r,f,attColor) {
    for(let rr=0;rr<8;rr++){
      for(let ff=0;ff<8;ff++){
        let p=this.board[rr][ff];
        if(p!==""&&this.colorOf(p)===attColor) {
          let moves=this.pseudoMoves(rr,ff,p);
          if(moves.some(m=>m.tr===r&&m.tf===f))return true;
        }
      }
    }
    return false;
  };

  Chess.prototype.pseudoMoves = function(r,f,piece){
    let moves=[];
    const add=(tr,tf)=>{moves.push({fr:r,ff:f,tr,tf});};
    const color=this.colorOf(piece);
    const isOpp=(tr,tf)=>(this.isOnBoard(tr,tf)&&this.pieceAt(tr,tf)!==""&&this.colorOf(this.pieceAt(tr,tf))!==color);
    const isEmpty=(tr,tf)=>(this.isOnBoard(tr,tf)&&this.pieceAt(tr,tf)==="");

    let pieceType=piece.toLowerCase();
    if(pieceType==='p'){
      let dir=color==='w'?-1:1;
      let startRank=color==='w'?6:1;
      let fr=r+dir;
      if(this.isOnBoard(fr,f)&&this.pieceAt(fr,f)==="") {
        add(fr,f);
        if(r===startRank && this.isOnBoard(fr+dir,f)&&this.pieceAt(fr+dir,f)===""&&this.pieceAt(fr,f)==="") add(fr+dir,f);
      }
      [f-1,f+1].forEach(nf=>{
        let nr=fr;
        if(this.isOnBoard(nr,nf)){
          let tp=this.pieceAt(nr,nf);
          if(tp!==""&&this.colorOf(tp)!==color) add(nr,nf);
          if(this.enPassantTarget && this.squareToCoords(this.enPassantTarget).f===nf && this.squareToCoords(this.enPassantTarget).r===nr) {
            add(nr,nf);
          }
        }
      });
    }
    else if(pieceType==='n'){
      let offs=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for(let off of offs){
        let tr=r+off[0],tf=f+off[1];
        if(this.isOnBoard(tr,tf)){
          let tp=this.pieceAt(tr,tf);
          if(tp===""||this.colorOf(tp)!==color) add(tr,tf);
        }
      }
    }
    else if(pieceType==='b'){
      this.addSliding(r,f,color,moves,[[-1,-1],[-1,1],[1,-1],[1,1]]);
    }
    else if(pieceType==='r'){
      this.addSliding(r,f,color,moves,[[-1,0],[1,0],[0,-1],[0,1]]);
    }
    else if(pieceType==='q'){
      this.addSliding(r,f,color,moves,[[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
    }
    else if(pieceType==='k'){
      let kingOff=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      for(let off of kingOff){
        let tr=r+off[0],tf=f+off[1];
        if(this.isOnBoard(tr,tf)){
          let tp=this.pieceAt(tr,tf);
          if(tp===""||this.colorOf(tp)!==color) add(tr,tf);
        }
      }

      // Rok (castling)
      let rank=color==='w'?7:0;
      if(r===rank&&f===4) {
        // Kısa rok
        let canKingCastle=(color==='w'?this.castlingRights.includes('K'):this.castlingRights.includes('k'));
        let canQueenCastle=(color==='w'?this.castlingRights.includes('Q'):this.castlingRights.includes('q'));
        if(canKingCastle && this.pieceAt(rank,5)==="" && this.pieceAt(rank,6)===""
           && !this.squareAttackedBy(rank,4,this.opColor(color))
           && !this.squareAttackedBy(rank,5,this.opColor(color))
           && !this.squareAttackedBy(rank,6,this.opColor(color))){
          add(rank,6);
        }
        // Uzun rok
        if(canQueenCastle && this.pieceAt(rank,3)==="" && this.pieceAt(rank,2)==="" && this.pieceAt(rank,1)===""
           && !this.squareAttackedBy(rank,4,this.opColor(color))
           && !this.squareAttackedBy(rank,3,this.opColor(color))
           && !this.squareAttackedBy(rank,2,this.opColor(color))){
          add(rank,2);
        }
      }
    }
    return moves;
  };

  Chess.prototype.addSliding=function(r,f,color,mvs,dirs){
    for(let d of dirs){
      let nr=r,nf=f;
      while(true){
        nr+=d[0];nf+=d[1];
        if(!this.isOnBoard(nr,nf))break;
        let tp=this.pieceAt(nr,nf);
        if(tp==="") {
          mvs.push({fr:r,ff:f,tr:nr,tf:nf});
        } else {
          if(this.colorOf(tp)!==color) mvs.push({fr:r,ff:f,tr:nr,tf:nf});
          break;
        }
      }
    }
  };

  Chess.prototype.squareToCoords=function(sq){
    let f=sq.charCodeAt(0)-"a".charCodeAt(0);
    let r=8 - parseInt(sq.charAt(1));
    return {r:f>=0 && f<8 && r>=0 && r<8?r:-1,f:f>=0 && f<8?f:-1,r};
  };

  Chess.prototype.generateMoves=function(color){
    let moves=[];
    for(let r=0;r<8;r++){
      for(let f=0;f<8;f++){
        let p=this.board[r][f];
        if(p!==""&&this.colorOf(p)===color){
          let pm=this.pseudoMoves(r,f,p);
          for(let mv of pm){
            let fromSq=this.coordsToSquare(r,f);
            let toSq=this.coordsToSquare(mv.tr,mv.tf);
            let moveObj={from:fromSq,to:toSq};
            // Promotion
            if(p.toLowerCase()==='p'&&(mv.tr===0||mv.tr===7)) {
              moveObj.promotion='q';
            }
            moves.push(moveObj);
          }
        }
      }
    }
    return moves;
  };

  Chess.prototype.coordsToSquare=function(r,f){
    return String.fromCharCode("a".charCodeAt(0)+f)+(8-r);
  };

  Chess.prototype.makeMove=function(m){
    this.history=this.history||[];
    let state={
      board:this.board.map(r=>r.slice()),
      activeColor:this.activeColor,
      castlingRights:this.castlingRights,
      enPassantTarget:this.enPassantTarget,
      halfmoveClock:this.halfmoveClock,
      fullmoveNumber:this.fullmoveNumber
    };
    this.history.push(state);

    let from=this.squareToCoords(m.from);
    let to=this.squareToCoords(m.to);
    let piece=this.board[from.r][from.f];
    let target=this.board[to.r][to.f];
    let color=this.colorOf(piece);

    // halfmove reset
    if(piece.toLowerCase()==='p'||target!=="") this.halfmoveClock=0;
    else this.halfmoveClock++;

    this.board[to.r][to.f]=m.promotion||piece;
    this.board[from.r][from.f]="";

    // en passant
    if(piece.toLowerCase()==='p'){
      if(Math.abs(to.r-from.r)===2) {
        // double push
        this.enPassantTarget=this.coordsToSquare((from.r+to.r)/2,to.f);
      } else {
        if(this.enPassantTarget && to.f===this.squareToCoords(this.enPassantTarget).f && to.r===this.squareToCoords(this.enPassantTarget).r) {
          let dir=color==='w'?1:-1;
          this.board[to.r+dir][to.f]="";
        }
        this.enPassantTarget=null;
      }
    } else {
      this.enPassantTarget=null;
    }

    // castling
    if(piece.toLowerCase()==='k'){
      let rank=color==='w'?7:0;
      if(from.r===rank && from.f===4 && to.r===rank && to.f===6) {
        // short castle
        this.board[rank][5]=this.board[rank][7];
        this.board[rank][7]="";
      }
      if(from.r===rank && from.f===4 && to.r===rank && to.f===2) {
        // long castle
        this.board[rank][3]=this.board[rank][0];
        this.board[rank][0]="";
      }
      // castling rights kaybı
      if(color==='w'){
        this.castlingRights=this.castlingRights.replace('K','').replace('Q','');
      } else {
        this.castlingRights=this.castlingRights.replace('k','').replace('q','');
      }
    }

    // rook move/capture castling rights
    if(piece.toLowerCase()==='r') {
      let rank=color==='w'?7:0;
      if(from.r===rank && from.f===0) {
        if(color==='w') this.castlingRights=this.castlingRights.replace('Q','');
        else this.castlingRights=this.castlingRights.replace('q','');
      }
      if(from.r===rank && from.f===7) {
        if(color==='w') this.castlingRights=this.castlingRights.replace('K','');
        else this.castlingRights=this.castlingRights.replace('k','');
      }
    }

    if(target!=="") {
      // captured a rook?
      if(to.r===7 && to.f===0) this.castlingRights=this.castlingRights.replace('Q','');
      if(to.r===7 && to.f===7) this.castlingRights=this.castlingRights.replace('K','');
      if(to.r===0 && to.f===0) this.castlingRights=this.castlingRights.replace('q','');
      if(to.r===0 && to.f===7) this.castlingRights=this.castlingRights.replace('k','');
    }

    if(piece.toLowerCase()==='k'){
      if(color==='w'){
        this.castlingRights=this.castlingRights.replace('K','').replace('Q','');
      } else {
        this.castlingRights=this.castlingRights.replace('k','').replace('q','');
      }
    }

    this.activeColor=this.activeColor==='w'?'b':'w';
    if(this.activeColor==='w') this.fullmoveNumber++;
  };

  Chess.prototype.undoMove=function(){
    let state=this.history.pop();
    this.board=state.board.map(r=>r.slice());
    this.activeColor=state.activeColor;
    this.castlingRights=state.castlingRights;
    this.enPassantTarget=state.enPassantTarget;
    this.halfmoveClock=state.halfmoveClock;
    this.fullmoveNumber=state.fullmoveNumber;
  };

  global.Chess = Chess;
})(window);
