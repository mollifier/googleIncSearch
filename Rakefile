COMMAND = "rdiscount"
OUTPUT_FILE_NAME = "README.html"

task :default => OUTPUT_FILE_NAME

desc "Convert README.md to HTML."
file OUTPUT_FILE_NAME => ["README.md"] do |t|
  sh "#{COMMAND} #{t.prerequisites[0]} > #{t.name}"
end

