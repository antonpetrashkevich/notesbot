1. invalidate cache on logout
2. batch import of paragraphs
3. show counter when importing paragraphs
4. avoid async snapshot handlers. use queue? https://chat.deepseek.com/a/chat/s/60fafad7-0dc6-4837-add8-641e7d987519. https://chatgpt.com/c/67ade9d8-0980-8001-bd86-0a9e6547f20b
5. on listen update, instead of full list rebuild, only change\add\remove those needed
6. sanitizer to delete orphan paragraphs
7. logout. then login. general error?
8. multi-region firestore? no, they are on same region (europe, usa) anyway. it's better to keep backups
9. заголовок заметки - макс одна строка. прятать излишек
10. input text area get replaced when note is fully loaded. losing input text therefore
11. replace fixedHeader with stickyHeader
12. input focus (add paragraph) is lost once firebase updates collection
13. delete folder (from same menu with delete account, sign out). restore deleted
14. показывать синк-статус. нужно понимать, когда параграф реально ушел. особенно, когда ты оффлайн.
15. add text along with the image. text always required.
16. set cache for firebase hosting. https://chatgpt.com/share/68ebdb1d-0978-8001-8054-fac9afe58874
17. use smaller material_symbols.woff2. only include those really needed
18. overflowing text in button.formPrimary, button.formSecondary
19. setup cors for firebase storage to work correctly. https://cloud.google.com/storage/docs/using-cors
20. trigger on storage alters to update total size in notebook
21. routine to check viloation, update storage, look for orphaned paragraphs
22. routine/trigger to update limit.paragraphs
23. manual backup. нельзя расчитывать только на google. вдруг они забанят.
24. add hotkeys - so that tab, enter works with buttons
25. catch unhandled errors. https://chatgpt.com/c/68f3c247-9454-8326-ba1a-d12080dd1eb8. and also web-workers errors https://chatgpt.com/c/68f3c436-0518-832c-8e86-180ec4e879ca
26. instead of updating every layer, keep top-level conllections (folderLayers, noteLayers, etc) and update only those needed.
27. wipe firebase cache in wipeCache()
28. firstore storage backup routine - once a week replicate to other region.
29. enable\setup appcheck, csp
30. multi-region (nam5) firestore and storage
31. test all pages before release. setup, keyphrase. netwrok lost, other errors
32. rethink setup, keyphrase design. separate layout for desktop and mobile
33. remove blocker.loading and blocker.error. leave only common
34. редактировать сообщения заметки всегда в новом полном окне. а показывать сокращённое
35. aes gcm tag - mandatory field


- 640px, 100% - 1rem -> 640px, 100%