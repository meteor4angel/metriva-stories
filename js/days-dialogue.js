window.DAYS_CAST = {
  mira: {name:'Mira',role:'Reader and garden volunteer',bio:'Curious, independent, and quietly funny. Mira values being asked what she wants instead of having her choices made for her.',images:{idle:'assets/days-mira-idle-transparent-v2.png',speaking:'assets/days-mira-speaking-transparent-v2.png',emphasis:'assets/days-mira-speaking-wide-transparent-v2.png',thoughtful:'assets/days-mira-thoughtful-transparent-v2.png',blink:'assets/days-mira-blink-transparent-v2.png'}},
  theo: {name:'Theo',role:'Bookshop volunteer and pianist',bio:'A considerate young neighbor who loves books, music, and the community garden. He is learning to say what he means without rushing anyone.',images:{idle:'assets/days-theo-idle-transparent-v2.png',soft:'assets/days-theo-speaking-conversational-transparent-v2.png',speaking:'assets/days-theo-speaking-amused-transparent-v2.png',emphasis:'assets/days-theo-speaking-emphasis-transparent-v2.png',thoughtful:'assets/days-theo-thoughtful-transparent-v2.png',thoughtfulBlink:'assets/days-theo-thoughtful-blink-transparent-v2.png',blink:'assets/days-theo-blink-aligned-transparent-v2.png'}}
};
// Narration and quoted speech stay separate so future voiceovers only read the spoken line.
window.DAYS_DIALOGUE = [
  [
    {who:'mira',action:'Mira gathers the paperback from the pavement outside Fleur & Livre.',line:'“I keep telling myself this bag is big enough for one more book.”',questions:[
      ['Is the book all right?','“A bent corner. I think it will survive.”','“You wrote something inside the cover.”','“Years ago. I wanted to remember that a place can feel like home.”'],
      ['Will you stay for the reading table?','“I came for coffee, but a chapter sounds nice.”','“You can leave whenever you like.”','“That makes staying feel much easier.”']]},
    {who:'theo',action:'Theo hands the last loose page back to Mira and steps aside to give her room.',line:'“The reading table starts at eleven. You would be welcome there.”',questions:[
      ['Do you volunteer here?','“Most Sundays. Books are a good excuse to meet the neighbors.”','“Is it a formal event?”','“Only if you count debating the ending over coffee.”'],
      ['Where is the reading table?','“Just inside, beside the window.”','“I might join for one chapter.”','“One chapter is a very good start.”']]}
  ],
  [
    {who:'mira',action:'Mira places a stack of returned books beside the reading-room shelf.',line:'“I came back for the books. Seeing you again is a lovely bonus.”',questions:[
      ['Which book should go first?','“The shelf numbers look like the answer.”','“Poems, travel, then gardens?”','“Exactly. The little things are easier together.”'],
      ['Are you going to the garden cleanup?','“I signed up before I knew you might be there.”','“I do not want you to feel obliged.”','“I do not. That is why I can say yes.”']]},
    {who:'theo',action:'Theo turns an annotated novel so Mira can read the note in its margin.',line:'“I like an ending that leaves room for both people to choose.”',questions:[
      ['Why write that in the margin?','“Too many stories mistake a grand gesture for listening.”','“What would you do instead?”','“Ask a question, and hear the answer.”'],
      ['What are you drinking?','“Black coffee. I should probably switch to tea.”','“I have mint tea.”','“Then we have found a perfectly balanced table.”']]}
  ],
  [
    {who:'mira',action:'Mira folds her umbrella beneath the bakery awning.',line:'“The rain changed my route. I would still like to make the cleanup.”',questions:[
      ['Which way is open?','“The canal path is closed. The poster points to Market Street.”','“We have time?”','“The bakery clock says two fifteen. We do.”'],
      ['Would you like the spare umbrella?','“That is kind, but I brought one.”','“All right. Shall we walk together?”','“Yes. That I would like.”']]},
    {who:'theo',action:'Theo checks the street map while rain taps softly against the window.',line:'“Market Street is still open. We can take the short way, if you want company.”',questions:[
      ['Why not Canal Walk?','“The council closed it until Monday.”','“And Bridge Road?”','“Open, but far longer. We would miss the start.”'],
      ['Are we late?','“Not yet. The cleanup begins at three.”','“Then let us go when the rain eases.”','“No rush. We have fifteen minutes to walk.”']]}
  ],
  [
    {who:'mira',action:'Mira stops beside the piano as the fundraiser winds down.',line:'“I know that melody. We used to play it at the community center.”',questions:[
      ['What do you remember about it?','“The opening notes: C, E, G, E.”','“Would you play it with me?”','“Only if we can laugh when I miss a note.”'],
      ['Is that an old photograph?','“Yes. I did not notice we were both in the same community group.”','“We almost met then.”','“Almost. I like that we met when we could actually talk.”']]},
    {who:'theo',action:'Theo rests his hands above the keys and waits for Mira to finish her thought.',line:'“I practiced this for the fundraiser. I did not know you knew it too.”',questions:[
      ['What are the first notes?','“C, E, G, E. The tune comes back once you start.”','“Then play slowly.”','“I will. You can join whenever you feel ready.”'],
      ['Did we meet at the community center?','“I think we were in the same room, years ago.”','“That sounds like the title of a song.”','“Maybe we should write the next verse ourselves.”']]}
  ],
  [
    {who:'mira',action:'Mira looks from the terrace to the Saturday reminder on her phone.',line:'“I have time next Saturday. I want to decide what that means together.”',questions:[
      ['What would you like?','“An honest invitation, and room to answer honestly.”','“Coffee at four thirty?”','“That sounds like something I can choose.”'],
      ['Could we stay friends?','“Of course. That is a real choice too.”','“No awkward disappearance?”','“No. We already have books and the garden.”']]},
    {who:'theo',action:'Theo leaves his phone on the table and meets Mira’s eyes.',line:'“Would you like to meet again next Saturday? Coffee, if that sounds good to you.”',questions:[
      ['Why next Saturday?','“You said you are free after four. I remembered.”','“You really listened.”','“I wanted to.”'],
      ['What if I would rather be friends?','“Then we keep our reading table and our garden Saturdays.”','“You mean that?”','“I do. Your answer matters more than my plan.”']]}
  ]
];
