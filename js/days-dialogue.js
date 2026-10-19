window.DAYS_CAST = {
  mira: {name:'Mira',role:'Reader and garden volunteer',bio:'Curious, independent, and quietly funny. Mira values being asked what she wants instead of having her choices made for her.',images:{idle:'assets/days-mira-idle-transparent-v2.png',speaking:'assets/days-mira-speaking-transparent-v2.png',emphasis:'assets/days-mira-speaking-wide-transparent-v2.png',thoughtful:'assets/days-mira-thoughtful-transparent-v2.png',blink:'assets/days-mira-blink-transparent-v2.png'}},
  theo: {name:'Theo',role:'Bookshop volunteer and pianist',bio:'A considerate young neighbor who loves books, music, and the community garden. He is learning to say what he means without rushing anyone.',images:{idle:'assets/days-theo-idle-transparent-v2.png',soft:'assets/days-theo-speaking-conversational-transparent-v2.png',speaking:'assets/days-theo-speaking-amused-transparent-v2.png',emphasis:'assets/days-theo-speaking-emphasis-transparent-v2.png',thoughtful:'assets/days-theo-thoughtful-transparent-v2.png',thoughtfulBlink:'assets/days-theo-thoughtful-blink-transparent-v2.png',blink:'assets/days-theo-blink-aligned-transparent-v2.png'}}
};
// The player asks about Mira and Theo’s thoughts. Recorded character lines are preserved; context identifies quoted exchanges between them.
window.DAYS_DIALOGUE = [
  [
    {who:'mira',action:'Mira gathers the paperback from the pavement outside Fleur & Livre.',line:'“I keep telling myself this bag is big enough for one more book.”',introContext:'You ask Mira about the book and her first impression of Theo.',questionContexts:[{},{}],questions:[
      ['Did the dropped book get damaged?','“A bent corner. I think it will survive.”','What does the writing inside the cover mean to you?','“Years ago. I wanted to remember that a place can feel like home.”'],
      ['What drew you to the reading table?','“I came for coffee, but a chapter sounds nice.”','How does it feel to know there is no pressure to stay?','“That makes staying feel much easier.”']]},
    {who:'theo',action:'Theo hands the last loose page back to Mira and steps aside to give her room.',line:'“The reading table starts at eleven. You would be welcome there.”',introContext:'He recalls the invitation he offered Mira after helping with her book.',questionContexts:[{},{"reply":"Theo imagines answering Mira if she stayed for just one chapter."}],questions:[
      ['How often do you volunteer, and what do you enjoy about it?','“Most Sundays. Books are a good excuse to meet the neighbors.”','Would you call it a formal event?','“Only if you count debating the ending over coffee.”'],
      ['Where would Mira find the reading table?','“Just inside, beside the window.”','What would you say if Mira stayed for just one chapter?','“One chapter is a very good start.”']]}
  ],
  [
    {who:'mira',action:'Mira places a stack of returned books beside the reading-room shelf.',line:'“I came back for the books. Seeing you again is a lovely bonus.”',introContext:'She remembers greeting Theo when she returned to the reading table.',questionContexts:[{"reply":"Mira reflects on sorting the books together with Theo."},{"answer":"Mira recalls how she explained the cleanup plans to Theo."}],questions:[
      ['How would you work out the order for these books?','“The shelf numbers look like the answer.”','Does helping Theo sort poems, travel, then gardens make it easier?','“Exactly. The little things are easier together.”'],
      ['Did you sign up for the cleanup because Theo would be there?','“I signed up before I knew you might be there.”','Do you feel any obligation to go just because Theo will be there?','“I do not. That is why I can say yes.”']]},
    {who:'theo',action:'Theo turns an annotated novel so Mira can read the note in its margin.',line:'“I like an ending that leaves room for both people to choose.”',introContext:'He talks about what the margin note says about getting to know Mira.',questionContexts:[{},{"reply":"Theo imagines replying to Mira about their coffee and mint tea."}],questions:[
      ['What were you thinking when you wrote in that margin?','“Too many stories mistake a grand gesture for listening.”','What matters more to you than a grand gesture?','“Ask a question, and hear the answer.”'],
      ['What are you drinking while you read?','“Black coffee. I should probably switch to tea.”','What would you say if Mira chose mint tea?','“Then we have found a perfectly balanced table.”']]}
  ],
  [
    {who:'mira',action:'Mira folds her umbrella beneath the bakery awning.',line:'“The rain changed my route. I would still like to make the cleanup.”',introContext:'She reflects on how the rain changed her plans for the garden.',questionContexts:[{},{"answer":"Mira imagines her reply to Theo’s offer of a spare umbrella."}],questions:[
      ['Which route would you suggest taking to the garden?','“The canal path is closed. The poster points to Market Street.”','Do you think there is still time to reach the cleanup?','“The bakery clock says two fifteen. We do.”'],
      ['What would you say if Theo offered you a spare umbrella?','“That is kind, but I brought one.”','Would you still want to walk to the garden with him?','“Yes. That I would like.”']]},
    {who:'theo',action:'Theo checks the street map while rain taps softly against the window.',line:'“Market Street is still open. We can take the short way, if you want company.”',introContext:'He recalls offering to walk with Mira.',questionContexts:[{},{}],questions:[
      ['What makes Canal Walk the wrong route today?','“The council closed it until Monday.”','What about taking Bridge Road instead?','“Open, but far longer. We would miss the start.”'],
      ['Are you and Mira running late for the cleanup?','“Not yet. The cleanup begins at three.”','Do you feel you and Mira need to rush?','“No rush. We have fifteen minutes to walk.”']]}
  ],
  [
    {who:'mira',action:'Mira stops beside the piano as the fundraiser winds down.',line:'“I know that melody. We used to play it at the community center.”',introContext:'She tells you what the melody brings back for her.',questionContexts:[{"reply":"Mira thinks about playing the melody together with Theo."},{"reply":"Mira reflects on when she and Theo finally had the chance to talk."}],questions:[
      ['What do you remember about the melody?','“The opening notes: C, E, G, E.”','Would you enjoy playing it with Theo?','“Only if we can laugh when I miss a note.”'],
      ['Did the photograph make you realise you and Theo were in the same group?','“Yes. I did not notice we were both in the same community group.”','So you and Theo nearly met back then?','“Almost. I like that we met when we could actually talk.”']]},
    {who:'theo',action:'Theo rests his hands above the keys and waits for Mira to finish her thought.',line:'“I practiced this for the fundraiser. I did not know you knew it too.”',introContext:'He recalls telling Mira how he prepared for the fundraiser.',questionContexts:[{"reply":"Theo puts into words how he would reassure Mira at the piano."},{"reply":"Theo imagines a next verse for his story with Mira."}],questions:[
      ['Which notes help you remember the tune?','“C, E, G, E. The tune comes back once you start.”','Would you play slowly and let Mira join when she feels ready?','“I will. You can join whenever you feel ready.”'],
      ['Do you think you and Mira crossed paths at the community center?','“I think we were in the same room, years ago.”','What would the next verse of your story with Mira be?','“Maybe we should write the next verse ourselves.”']]}
  ],
  [
    {who:'mira',action:'Mira looks from the terrace to the Saturday reminder on her phone.',line:'“I have time next Saturday. I want to decide what that means together.”',introContext:'She shares what she hopes to tell Theo about next Saturday.',questionContexts:[{"reply":"Mira considers the idea of coffee with Theo."},{"reply":"Mira reflects on the friendship they already share."}],questions:[
      ['What would make Theo’s invitation feel right to you?','“An honest invitation, and room to answer honestly.”','How would you feel about coffee with Theo at four thirty?','“That sounds like something I can choose.”'],
      ['Do you think friendship could be a good outcome for you and Theo?','“Of course. That is a real choice too.”','If you chose friendship, would you expect him to disappear?','“No. We already have books and the garden.”']]},
    {who:'theo',action:'Theo leaves his phone on the table and meets Mira’s eyes.',line:'“Would you like to meet again next Saturday? Coffee, if that sounds good to you.”',introContext:'He shares the invitation he has in mind for Mira.',questionContexts:[{"answer":"Theo shares the explanation he would give Mira for choosing Saturday."},{"answer":"Theo imagines reassuring Mira if she wanted to stay friends.","reply":"Theo puts his reassurance to Mira into words."}],questions:[
      ['Why would you suggest next Saturday to Mira?','“You said you are free after four. I remembered.”','Did you want to remember what mattered to her?','“Yeah. I was hoping I’d get to see you again.”'],
      ['What would you say if Mira wanted to stay friends?','“Then we keep our reading table and our garden Saturdays.”','Do you mean that her answer matters more than your plan?','“I do. Your answer matters more than my plan.”']]}
  ]
];
