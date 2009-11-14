COMMAND = "rdiscount"

task :default => "html"

file "html" => ["README.md"] do
  sh "#{COMMAND} README.md > README.html" 
end

