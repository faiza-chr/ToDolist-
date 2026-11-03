
// Tableau qui contient toutes les tâches
// Chaque tâche est un objet : { text: string, completed: boolean }
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
// Variable qui stocke le filtre actuel
// "all" | "active" | "completed"
let filter = "all";
// Référence à la liste HTML <ul>
const list = document.getElementById("taskList");
const input = document.getElementById("taskInput");
const themeBtn = document.getElementById("themeBtn");
const themeclair = document.getElementById("themeclair");
const body= document.body;
const app=document.querySelector(".site-container" );
const nbItem= document.getElementById("nbItem");

// Sauvegarde les tâches dans le navigateur
function save() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}
document.getElementById("taskInput").addEventListener("keydown", function(e){
    if(e.key === "Enter"){  addTask();
        saveData();
     }
});

// Affiche les tâches à l’écran
// ----------------------------
function render() {
  list.innerHTML = "";

  tasks
    .filter(task => {
// Si le filtre est "active" on affiche seulement les tâches non terminées
      
      if (filter === "active") return !task.completed;
 // Si le filtre est "completed" on affiche seulement les tâches terminées
      
      if (filter === "completed") return task.completed;
  // on affiche toutes les tâches     
      return true;
    })
    .forEach((task, index) => {
      const li = document.createElement("li");
      if (task.completed) li.classList.add("completed");

      li.innerHTML = `
        <div class="task">
          <div class="circle" onclick="toggleTask(${index})"></div>
          <span>${task.text}</span>
        </div>
        <button  id= "btnx" class="delete" onclick="deleteTask(${index})"> </button>
      `;

      list.appendChild(li);
     let item=tasks.length;
     console.log(item);
     nbItem.textContent= item +" items left";
    });
}
// Ajoute une nouvelle tâche
function addTask() {
  if (input.value.trim() === "") return;
  tasks.push({ text: input.value, completed: false });
  input.value = "";
  save();
  render();
}
// Change l’état d’une tâche (terminée / non terminée)
function toggleTask(index) {
  tasks[index].completed = !tasks[index].completed;
  save();
  render();
}
// Supprime une tâche
function deleteTask(index) {
  tasks.splice(index, 1);
  save();
  render();
}
// Change le filtre (all / active / completed)
function filterTasks(type) {
  filter = type;
  render();
}
// Supprime toutes les tâches terminées
function clearCompleted() {
  tasks = tasks.filter(task => !task.completed);
  save();
  render();
}
// changer le theme clair ou sombre 
   themeBtn.addEventListener("click", () => {
        if (body.classList.contains("clair")) {
            body.classList.replace("clair", "sombre");
            
        } else {
            body.classList.replace("sombre", "clair");
            
        }
    });



render();
const  controls= document.querySelector(".controls");
const contenair= document.querySelector(".contenair");
const btnclear = document.getElementById("clear");
const mediaQuery = window.matchMedia("(max-width: 375px)");
function handleMobile(e) {
  if (e.matches) {
    contenair.appendChild(btnclear);
    contenair.appendChild(nbItem);
  } 
  
}
function eMobile(e) {
  if (e.matches) {
    contenair.appendChild(btnclear);
   
  } 
  
}
window.addEventListener("load", handleMobile,eMobile);
window.addEventListener("resize", handleMobile,eMobile);
